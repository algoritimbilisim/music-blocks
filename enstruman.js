
function createInstrument() {
    let usableNotes = ["A#4","A4","B4","C5","D#5","D5","E4","E5","G#4","G4"];

    let clone = document.querySelector(".note").cloneNode(true);
    document.querySelector(".note").remove();

    let instrument = document.querySelector("#instrument");

    for(note of usableNotes){
        let elem = clone.cloneNode(true);
        elem.querySelector(".title").innerText=note;

        for (var i = 0; i < 10; i++) {
            let block = elem.querySelector(".block").cloneNode(true);
            elem.appendChild(block);
        }

        instrument.appendChild(elem);
    }
}
createInstrument();

function addOverlay(subBlock, width = '400') {
    console.log(width)
    let blockCount = width / 100;
    let parentBlock = subBlock.parentNode.parentNode;
    let subBlocks = Array.from(parentBlock.querySelectorAll(".sub-block"));
    let index = subBlocks.indexOf(subBlock);

    if (controlNextBlocks(subBlocks, index, blockCount)) {
        let overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.id = 'overlay-' + Date.now(); // unique ID for each overlay
        overlay.style.width = width + "%";
        overlay.style.height = '100%';
        overlay.style.zIndex = '100';
        overlay.draggable = true;
        overlay.ondragstart = function(event) {
            event.dataTransfer.setData('index', index); // dummy data
            event.dataTransfer.setData('width', parseInt(event.target.style.width)); // store the width
            this.style.zIndex = '0';
            this.parentElement.classList.add('dragging');
        }

        overlay.ondragend = function(event) {
            let originSubBlock = document.querySelectorAll(".sub-block")[event.dataTransfer.getData('index')];
            originSubBlock.classList.remove('dragging');
            this.style.zIndex = '100';
        }

        // add resize observer
        let ro = new ResizeObserver(entries => {
            for (let entry of entries) {
                const widthPercent = entry.contentRect.width / subBlock.offsetWidth * 100;
                overlay.style.width = `${Math.ceil(widthPercent / 100) * 100}%`;
                
            }
        });
        ro.observe(overlay);
        subBlock.appendChild(overlay);
        overlay.style.display = 'block';

        // mark the sub-blocks as filled
        for (let i = 0; i < blockCount; i++) {
            subBlocks[index + i].classList.add('filled');
        }
    } else {
        alert("İşlem başarısız. Yeterli boş alan yok.");
    }
}


function allowDrop(event) {
    event.preventDefault();
}

function drop(event, target) {
    event.preventDefault();
    let originSubBlock = document.querySelectorAll(".sub-block")[event.dataTransfer.getData('index')];

    let width = event.dataTransfer.getData('width'); // retrieve the width
    let blockCount = width / 100;
    // remove the filled class from the original sub-blocks
    let parentBlock = originSubBlock.parentNode.parentNode;
    let subBlocks = Array.from(parentBlock.querySelectorAll(".sub-block"));
    let index = subBlocks.indexOf(originSubBlock);

    for (let i = 0; i < blockCount; i++) {
        subBlocks[index + i].classList.remove('filled');
    }
    originSubBlock.removeChild(originSubBlock.firstChild);
    addOverlay(target, width); // call with the width
}


function controlNextBlocks(subBlocks, index, blockCount) {
    let status = true;

    for (var i = 0; i < blockCount; i++) {
        status = status && !subBlocks[index + i]?.firstChild;
        console.log(status)
    }

    return status;
}