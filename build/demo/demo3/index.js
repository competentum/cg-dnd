(function () {
    var checkButton = document.querySelector('.check-btn'),
        resetButton = document.querySelector('.reset-btn');

    var settings = {
        alignRemainingDragItems: true,
        possibleToReplaceDroppedItem: true,
        container: '.container',
        commonDragItemsSettings: {
            selectedItemClassName: 'selected-item'
        },
        dragItems: [
            {
                node: '#item-1',
                data: 4,
                ariaLabel: 'Pineapple'
            },
            {
                node: '#item-2',
                data: 1,
                ariaLabel: 'Orange'
            },
            {
                node: '#item-3',
                data: 2,
                ariaLabel: 'Lemon'
            },
            {
                node: '#item-4',
                data: 3,
                ariaLabel: 'Strawberry'
            }
        ],
        dropAreas: [
            {
                node: '#area-1',
                ariaLabel: 'is the fruit of the citrus species native to China.',
                data: 1,
            },
            {
                node: '#area-2',
                ariaLabel: 'is a species of small evergreen tree, native to South Asia, primarily North eastern India.',
                data: 2
            },
            {
                node: '#area-3',
                ariaLabel: 'is a widely grown hybrid species of the genus Fragaria, which are cultivated worldwide for their fruit.' +
                    ' The fruit is widely appreciated for its characteristic aroma, bright red color, juicy texture, and sweetness.',
                data: 3
            },
            {
                node: '#area-4',
                ariaLabel: 'is a tropical plant with an edible fruit. In 2016, Costa Rica, Brazil, and the Philippines accounted' +
                    ' for nearly one-third of the world\'s production of this plant.',
                data: 4
            }
        ],
        onDragStop: function (e, params) {
            if (params.replacedDragItem) {
                /**
                 * Use setTimeout, that transition was set and focus will be set after animation end, otherwise NVDA reads aria-label twice
                 */
                setTimeout(function () {
                    if (params.replacedDragItem.chosenDropArea) {
                        /**
                         * When we replace drag items, which both are dropped
                         */
                        params.replacedDragItem.chosenDropArea.focus();
                    } else {
                        params.replacedDragItem.focus();
                    }
                }, 0);
            } else if (params.remainingDragItems[0]) {
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