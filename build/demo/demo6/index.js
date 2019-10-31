(function () {
    var droppedItemMargin = 20;
        checkButton = document.querySelector('.check-btn'),
        resetButton = document.querySelector('.reset-btn');

    // Quickly sketched this function without optimization =)
    function improveTargetHeight(dropTarget) {
        if (dropTarget.innerDragItems.length) {
            var droppedItemsCommonHeight = dropTarget.innerDragItems.reduce(function (result, item) {
                result += item.node.getBoundingClientRect().height + droppedItemMargin;

                return result;
            }, 0);

            dropTarget.node.style.height = droppedItemsCommonHeight + 'px';
        } else if (dropTarget.node.style.height) {
            dropTarget.node.style.height = '';
        }
    }

    var settings = {
        alignRemainingDragItems: true,
        container: '.container',
        commonDragItemsSettings: {
            selectedItemClassName: 'selected-item',
        },
        possibleToReplaceDroppedItem: true,
        commonDropAreasSettings: {
            maxItemsInDropArea: 0,
            snapAlignParams: {
                horizontalAlign: 'center',
                withDroppedItemCSSMargins: true,
                eachDroppedItemIndents: [0, 0, droppedItemMargin, 0],
            }
        },
        dragItems: [
            {
                node: '#item-1',
                data: 1,
                ariaLabel: 'Brachiosaurus'
            },
            {
                node: '#item-2',
                data: 2,
                ariaLabel: 'Allosaurus'
            },
            {
                node: '#item-3',
                data: 2,
                ariaLabel: 'Spinosaurus'
            },
            {
                node: '#item-4',
                data: 1,
                ariaLabel: 'Diplodocus'
            },
            {
                node: '#item-5',
                data: 1,
                ariaLabel: 'Stegosaurus'
            },
            {
                node: '#item-6',
                data: 1,
                ariaLabel: 'Triceratops'
            },
            {
                node: '#item-7',
                data: 2,
                ariaLabel: 'Tyrannosaurus'
            }
        ],
        dropAreas: [
            {
                node: '#area-1',
                ariaLabel: 'Herbivorous Dinosaurs',
                data: 1,
            },
            {
                node: '#area-2',
                ariaLabel: 'Predator Dinosaurs',
                data: 2
            }
        ],
        onDragStop: function (e, params) {
            if (params.dragItem && params.dropArea) {
                params.dragItem.correct = params.dragItem.data === params.dropArea.data;

                improveTargetHeight(params.dropArea);
            }

            if (params.previousDropArea) {
                improveTargetHeight(params.previousDropArea);
            }

            if (params.remainingDragItems[0]) {
                params.remainingDragItems[0].focus();
            } else {
                checkButton.focus();
            }
        },
        onCreate: function (dndObj) {
            console.log(dndObj);
        }
    };

    var dnd = new CgDnd(settings);

    checkButton.addEventListener('click', function () {
        checkActivity(dnd);

        improveTargetHeight(dnd.dropAreas[0]);
        improveTargetHeight(dnd.dropAreas[1]);
    });

    resetButton.addEventListener('click', function () {
        dnd.reset();
        dnd.firstRemainingDragItem.focus({ liveText: 'Activity was reset.' });

        improveTargetHeight(dnd.dropAreas[0]);
        improveTargetHeight(dnd.dropAreas[1]);
    });
})();