const draggables = document.querySelectorAll('.draggable');

let mousedownID = -1;
const mousedownInterval = 10;

let mousePos = {};

const updateInterval = 10;
let batSpawnInterval = 3000;
const batSpawnIntervalMin = 1200;
const batSpawnIntervalModifier = 20;

let updateI = null;
let makeBatI = null;

const container = document.querySelector('#container');
const originalBat = document.querySelector('#originalBat');

const lantern = document.querySelector('#lantern');

const bats = [];
const baseBatHP = 100;
const maxBatCount = 100;

const originalPoof = document.querySelector('#originalPoof');
let poofHideTimeout;
const poofHideDelay = 500;

const crystal = document.querySelector('#crystal');
const crystalHitbox = document.querySelector('#crystal .hitbox');

const healthBar = document.querySelector('#health-bar');
const playerHealthMax = 100;
let playerHealth = playerHealthMax;
const damageTick = .1;
const healTick = .1;

const startBtn = document.querySelector('#startBtn');
startBtn.addEventListener('click', () => {
    Start();
});
const menu = document.querySelector('#menu');
const menuContainer = document.querySelector('#menu-container');

let stopped = true;

const endScreen = document.querySelector('#end-screen');
endScreen.style.display = "none";

const restartBtn = document.querySelector('#restartBtn');
restartBtn.addEventListener('click', () => {
    Restart();
});

let currentScore = 0;
let highScore = 0;
const scoreInGameE = document.querySelector('#in-game-score');
updateScore();
const scoreBatValue = 5;
const scoreEndE = document.querySelector('#score');
const highScoreEndE = document.querySelector('#high-score');
const highScoreStartE = document.querySelector('#high-score-start');
highScoreStartE.textContent = getHighScore();

if (getHighScore() === null) {
    localStorage.setItem('highScore') = 0;
}

document.addEventListener('mousemove', (e) => {
    mousePos.x = e.pageX;
    mousePos.y = e.pageY;
});

for (const draggableItem of draggables) {
    draggableItem.addEventListener('mousedown', function (e) {
        this.classList.add('dragging');
        const rect = this.getBoundingClientRect();
        const offsets = {};
        offsets.x = e.clientX - rect.x;
        offsets.y = e.clientY - rect.y;
        if (mousedownID === -1) {
            mousedownID = setInterval(() => whileMouseDown(this, offsets), mousedownInterval);
        }
    });
}

document.addEventListener('mouseup', () => {
    for (const draggable of draggables) {
        if (draggable.classList.contains('dragging')) {
            draggable.classList.remove('dragging');
            if (mousedownID !== -1) {
                clearInterval(mousedownID);
                mousedownID = -1;
            }
            // const rect = draggable.getBoundingClientRect();
            // if (rect.left + draggable.clientWidth > container.clientWidth) {
            //     draggable.style.left = container.clientWidth - draggable.clientWidth + 'px';
            // } else if (rect.left < 0) {
            //     draggable.style.left = 0;
            // }
            // if (rect.top + draggable.clientHeight > container.clientHeight) {
            //     draggable.style.top = container.clientHeight - draggable.clientHeight + 'px';
            // } else if (rect.top < 0) {
            //     draggable.style.top = 0;
            // }
        }
    }
});

function whileMouseDown(obj, offsets) {
    if (!stopped) {
        obj.style.left = mousePos.x - offsets.x + 'px';
        obj.style.top = mousePos.y - offsets.y + 'px';
        const rect = obj.getBoundingClientRect();
        if (rect.left + obj.clientWidth > container.clientWidth) {
            obj.style.left = container.clientWidth - obj.clientWidth + 'px';
        } else if (rect.left < 0) {
            obj.style.left = 0;
        }
        if (rect.top + obj.clientHeight > container.clientHeight) {
            obj.style.top = container.clientHeight - obj.clientHeight + 'px';
        } else if (rect.top < 0) {
            obj.style.top = 0;
        }
    }
}

function Start() {
    if (stopped) {
        stopped = false;
        setTimeout(() => {
            moveAtRandomPos(lantern);
        }, 2);
        moveAtRandomPos(crystal);
        if (updateI === null) {
            updateI = setInterval(Update, updateInterval);
        }
        if (makeBatI === null) {
            makeBatI = setInterval(makeBat, batSpawnInterval);
        }
        menuContainer.style.display = 'none';
        menu.style.display = 'none';
    }
}

function Update() {
    let crystalOverlappingCount = 0;
    for (let bat of bats) {
        if (elementsOverlap(lantern, bat.bat)) {
            if (bat.bat.children[0].style.zIndex != 1) {
                bat.bat.children[0].style.zIndex = 1;
            }
            if (elementsOverlap(lantern, bat.bat.children[1])) {
                if (bat.batHP === baseBatHP) {
                    let imgSrc = bat.bat.children[1].getAttribute('src');
                    bat.bat.children[1].setAttribute('src', imgSrc.replace('1', '2'));
                }
                if (bat.batHP <= 0) {
                    killBat(bat);
                    updateScore(scoreBatValue);
                } else {
                    bat.batHP -= 1;
                }
            } else {
                closeBatEyes(bat.bat);
                bat.batHP = baseBatHP;
            }
        } else if (bat.bat.children[0].style.zIndex != -1) {
            bat.bat.children[0].style.zIndex = -1;
            closeBatEyes(bat.bat);
            bat.batHP = baseBatHP;
        }
        bat.bat.moveTowards(crystal);
        if (elementsOverlap(crystalHitbox, bat.bat.children[1])) {
            crystalOverlappingCount++;
        }
    }
    if (elementsOverlap(crystalHitbox, lantern)) {
        crystalOverlappingCount++;
    }
    if (crystal.classList.contains('dragging')) {
        crystalOverlappingCount++;
    }
    if (crystalOverlappingCount > 0) {
        crystalTakeDamage(crystalOverlappingCount);
    } else {
        crystalClear();
    }
}

function Stop() {
    if (!stopped) {
        stopped = true;
    }
    if (updateI !== null) {
        clearInterval(updateI);
        updateI = null;
    }
    if (makeBatI !== null) {
        clearInterval(makeBatI);
        makeBatI = null;
    }
}

function closeBatEyes(bat) {
    let imgSrc = bat.children[1].getAttribute('src');
    bat.children[1].setAttribute('src', imgSrc.replace('2', '1'));
}

function killBat(bat) {
    const batIndex = bats.indexOf(bat);
    if (batIndex > -1) {
        bats.splice(batIndex, 1);
    }
    const rect = bat.bat.getBoundingClientRect();
    poofShow(rect.top + bat.bat.clientHeight / 2 - originalPoof.clientHeight / 2 + 'px', rect.left + bat.bat.clientWidth / 2 - originalPoof.clientWidth / 2 + 'px');
    bat.bat.remove();
}

function elementsOverlap(el1, el2) {
    const domRect1 = el1.getBoundingClientRect();
    const domRect2 = el2.getBoundingClientRect();

    return !(
        domRect1.top > domRect2.bottom ||
        domRect1.right < domRect2.left ||
        domRect1.bottom < domRect2.top ||
        domRect1.left > domRect2.right
    );
}

function makeBat() {
    if (bats.length < maxBatCount) {
        const newBat = originalBat.cloneNode(true);
        newBat.removeAttribute('id');
        container.append(newBat);
        moveAtRandomPos(newBat);
        bats.push({ bat: newBat, batHP: baseBatHP });
        if (batSpawnInterval >= batSpawnIntervalMin) {
            decreaseBatSpawnInterval();
        }
    }
}

function moveAtRandomPos(obj) {
    obj.style.top = Math.floor(Math.random() * (container.clientHeight - obj.clientHeight)) + 'px';
    obj.style.left = Math.floor(Math.random() * (container.clientWidth - obj.clientWidth)) + 'px';
}

function decreaseBatSpawnInterval() {
    if (batSpawnInterval > batSpawnIntervalMin) {
        batSpawnInterval -= batSpawnIntervalModifier;
        clearInterval(makeBatI);
        makeBatI = setInterval(makeBat, batSpawnInterval);
    } else if (batSpawnInterval !== batSpawnIntervalMin) {
        batSpawnInterval = batSpawnIntervalMin;
    }
}

function poofShow(top, left) {
    const poofDiv = originalPoof.cloneNode(true);
    container.append(poofDiv);
    poofDiv.style.top = top;
    poofDiv.style.left = left;
    setTimeout(() => {
        poofDiv.style.opacity = 1;
        poofDiv.style.transform = 'scale(1.5)';
    }, 10);
    setTimeout(() => poofDiv.remove(), poofHideDelay);
}

const Vector2 = function (x, y) {
    this.x = x;
    this.y = y;
}

Vector2.prototype.normalize = function () {
    const length = Math.sqrt(this.x * this.x + this.y * this.y);
    this.x = this.x / length;
    this.y = this.y / length;
}

HTMLElement.prototype.moveTowards = function (target) {
    const objRect = this.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetPos = new Vector2(targetRect.left + targetRect.width / 2 - objRect.width / 2, targetRect.top + targetRect.height / 2 - objRect.height / 2);
    const direction = new Vector2(targetPos.x - objRect.left, targetPos.y - objRect.top);
    direction.normalize();
    this.style.left = (objRect.left + direction.x) + 'px';
    this.style.top = (objRect.top + direction.y) + 'px';
}

function crystalTakeDamage(multiplier = 1) {
    if (!crystal.classList.contains('crystal-purple')) {
        crystal.classList.add('crystal-purple');
    }
    updateHealth(-damageTick * multiplier);
    updateHealthBar();
}

function crystalClear() {
    if (crystal.classList.contains('crystal-purple')) {
        crystal.classList.remove('crystal-purple');
    }
    updateHealth(healTick);
    updateHealthBar();
}

function updateHealth(value) {
    playerHealth += value;
    if (playerHealth < 0) {
        playerHealth = 0;
        endGame();
    } else if (playerHealth > 100) {
        playerHealth = playerHealthMax;
    }
}

function updateHealthBar() {
    healthBar.style.width = playerHealth / playerHealthMax * 100 + '%';
}

function endGame() {
    Stop();
    menuContainer.style.display = 'flex';
    endScreen.style.display = 'flex';
    scoreEndE.textContent = currentScore;
    updateHighScore(currentScore);
    highScoreEndE.textContent = getHighScore();
}

function Restart() {
    setTimeout(Start, 50);
    menuContainer.style.display = 'none';
    endScreen.style.display = 'none';
    playerHealth = playerHealthMax;
    updateHealthBar();
    for (let i = bats.length - 1; i >= 0; i--) {
        killBat(bats[i]);
    }
    updateScore(-currentScore);
}

function updateScore(value = 0) {
    currentScore += value;
    scoreInGameE.textContent = currentScore;
}

function updateHighScore(value) {
    if (value > getHighScore()) {
        localStorage.setItem('highScore', value);
    }
}

function getHighScore() {
    return localStorage.getItem('highScore');
}


setTimeout(scrollToTop, 20);
setInterval(scrollToTop, 2000);
function scrollToTop() { window.scrollTo(0, 0); }
window.onscroll = scrollToTop;