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
                ariaLabel: 'mu equals 2, sigma squared equals 1'
            },
            {
                node: '#item-2',
                data: 'green',
                ariaLabel: 'mu equals 0, sigma squared equals 0.2'
            },
            {
                node: '#item-3',
                data: 'yellow',
                ariaLabel: 'mu equals minus 2, sigma squared equals 0.5'
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
                        dnd.say('Correct!');

                        setTimeout(function () {
                            params.remainingDragItems[0].focus();
                        }, VISUALLY_DELAY);
                    } else {
                        dnd.say('Congratulations! You passed the activity.');
                    }
                } else {
                    dnd.say('Incorrect!');

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