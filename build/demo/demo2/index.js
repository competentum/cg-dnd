(function () {
    var VISUALLY_DELAY = 1100;

    var settings = {
        forbidFocusOnFilledDropAreas: true,
        container: '.container',
        commonDragItemsSettings: {
            selectedItemClassName: 'selected-item',
        },
        dragItems: [
            {
                node: '#item-1',
                data: 'blue',
                ariaLabel: 'Pyotr Ilyich Tchaikovsky'
            },
            {
                node: '#item-2',
                data: 'green',
                ariaLabel: 'Wolfgang Amadeus Mozart'
            },
            {
                node: '#item-3',
                data: 'yellow',
                ariaLabel: 'Ludwig van Beethoven'
            }
        ],
        dropAreas: [
            {
                node: '#area-1',
                ariaLabel: 'Green graph.',
                data: 'green',
            },
            {
                node: '#area-2',
                ariaLabel: 'Blue graph.',
                data: 'blue'
            },
            {
                node: '#area-3',
                ariaLabel: 'Yellow graph.',
                data: 'yellow'
            }
        ],
        onDragStop: function (e, params) {
            if (params.dragItem && params.dropArea) {
                params.dragItem.correct = params.dragItem.data === params.dropArea.data;

                if (params.dragItem.correct) {
                    if (params.remainingDragItems[0]) {
                        setTimeout(function () {
                            params.remainingDragItems[0].focus();
                        }, VISUALLY_DELAY);
                    } else {
                     //   setLiveText(ALL_CORRECT_MESSAGE);
                    }
                } else {
                    setTimeout(function () {
                        params.dragItem.reset();
                        params.dragItem.focus();
                    }, VISUALLY_DELAY);
                }
            }
        },
        onCreate: function (dndObj) {
            console.log(dndObj);
        }
    };

    var dnd = new CgDnd(settings);
})();