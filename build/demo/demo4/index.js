(function () {
    var checkButton = document.querySelector('.check-btn'),
        resetButton = document.querySelector('.reset-btn');

    var settings = {
        alignRemainingDragItems: true,
        container: '.container',
        commonDragItemsSettings: {
            selectedItemClassName: 'selected-item',
        },
        possibleToReplaceDroppedItem: false,
        commonDropAreasSettings: {
            maxItemsInDropArea: 2,
            snapAlignParams: {
                horizontalAlign: 'center',
                verticalAlign: 'bottom',
            }
        },
        dragItems: [
            {
                node: '#item-1',
                data: 3,
                ariaLabel: 'addition'
            },
            {
                node: '#item-2',
                data: 2,
                ariaLabel: 'multiplication'
            },
            {
                node: '#item-3',
                data: 3,
                ariaLabel: 'subtraction'
            },
            {
                node: '#item-4',
                data: 1,
                ariaLabel: 'exponentiation'
            },
            {
                node: '#item-5',
                data: 2,
                ariaLabel: 'division'
            },
            {
                node: '#item-6',
                data: 1,
                ariaLabel: 'root extraction'
            }
        ],
        dropAreas: [
            {
                node: '#area-1',
                ariaLabel: 'The order of operations is a collection of rules that reflect conventions about which procedures to'
                    + ' perform first in order to evaluate a given mathematical expression. First, blank is(are) performed.',
                data: 1,
            },
            {
                node: '#area-2',
                ariaLabel: 'Then, blank is(are) performed.',
                data: 2
            },
            {
                node: '#area-3',
                ariaLabel: 'Finally, blank is(are) performed.',
                data: 3
            }
        ],
        onDragStop: function (e, params) {
            if (params.dragItem && params.dropArea) {
                params.dragItem.correct = params.dragItem.data === params.dropArea.data;
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
    });

    resetButton.addEventListener('click', function () {
        dnd.reset();
        dnd.firstRemainingDragItem.focus({ liveText: 'Activity was reset.' });
    });
})();