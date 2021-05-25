import BLOCKS from "./blocks.js"

// DOM
const playground = document.querySelector(".playground > ul");
const gameText = document.querySelector(".game-text");
const restartButton = document.querySelector(".game-text > button");
const scoreText = document.querySelector(".score");

// Setting
const GAME_ROWS = 20;
const GAME_COLS = 10;

// variables
let score = 0;
let droptime = 500;
let downInterval;
let tempMovingItem;



const movingItem = 
{
    type: "T",
    direction: 0,
    top: 0,
    left: 3,
};



// functions
function init()
{
    for(let i=0; i<GAME_ROWS; i++)
        prependNewLine();

    setScore(0);
    
    generateNewBlock();
}

function prependNewLine()
{
    const li = document.createElement("li");
    const ul = document.createElement("ul");
    for(let j=0; j<GAME_COLS; j++)
    {
        const matrix = document.createElement("li");
        ul.prepend(matrix);
    }
    li.prepend(ul);
    playground.prepend(li);
}

function renderBlocks(moveType="")
{
    const { type, direction, top, left } = tempMovingItem;

    const movingBlocks = document.querySelectorAll(".moving");
    movingBlocks.forEach(moving =>
    {
        moving.classList.remove(type, "moving");
    });

    BLOCKS[type][direction].some(block=>
    {
        const x = block[0] + left;
        const y = block[1] + top;

        const target = playground.childNodes[y] && playground.childNodes[y].childNodes[0].childNodes[x] ? 
                       playground.childNodes[y].childNodes[0].childNodes[x] : null;

        if(target && !target.classList.contains("seized"))
            target.classList.add(type, "moving");
        else
        {
            tempMovingItem = { ...movingItem };

            if(moveType=="retry")
            {
                clearInterval(downInterval);
                showGameoverText();
            }

            setTimeout(() =>
            {
                renderBlocks("retry");
                if(moveType == "top")
                {
                    seizeBlock();
                }
            } , 0);
            return true;
        }
    });
    movingItem.left = left;
    movingItem.top = top;
    movingItem.direction = direction;

}

function showGameoverText()
{
    gameText.style.display = "flex";
}

function generateNewBlock()
{
    clearInterval(downInterval);
    downInterval = setInterval(()=>
    {
        moveBlock('top', 1);
    }, droptime);

    const blockArray = Object.entries(BLOCKS);
    const randomIndex = Math.floor(Math.random() * blockArray.length);
    movingItem.type = blockArray[randomIndex][0];
    movingItem.top = 0;
    movingItem.left = 3;
    movingItem.direction = 0;
    tempMovingItem = { ...movingItem };
    renderBlocks();
}

function seizeBlock()
{
    const movingBlocks = document.querySelectorAll(".moving");
    movingBlocks.forEach(moving =>
    {
        moving.classList.remove("moving");
        moving.classList.add("seized");
    });
    checkLine();
}

function checkLine()
{
    const childNodes = playground.childNodes;
    childNodes.forEach(child=>
    {
        let lineclear = true;
        child.children[0].childNodes.forEach(li=>
        {
            if(!li.classList.contains("seized"))
            {
                lineclear = false;
            }
        })

        if(lineclear)
        {
            child.remove();
            prependNewLine();
            setScore(score+1);
        }
    })
    generateNewBlock();
}

function setScore(s)
{
    score=s;
    scoreText.innerText=score;
}

function moveBlock(moveType, amount)
{
    tempMovingItem[moveType]+=amount;
    renderBlocks(moveType);
}

function rotateBlock()
{
    tempMovingItem["direction"]=(tempMovingItem["direction"]+1)%4;
    renderBlocks();
}

function dropBlock()
{
    clearInterval(downInterval);
    downInterval = setInterval(()=>
    {
        moveBlock('top', 1);
    }, 20);
}

init();

// event handling
document.addEventListener("keydown", e=>
{
    switch(e.keyCode)
    {
        case 37: // left
            moveBlock("left",-1); break;
        case 39: // right
            moveBlock("left",1); break;
        case 40: // down
            moveBlock("top",1); break;
        case 38: // up
            rotateBlock(); break; // need rotate
        case 32:
            dropBlock(); break;
        default:
            break;
    }
})

restartButton.addEventListener("click", ()=>
{
    playground.innerHTML = "";
    gameText.style.display = "none";
    init();
});