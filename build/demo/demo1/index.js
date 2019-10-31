(function () {
    var checkButton = document.querySelector('.check-btn'),
        resetButton = document.querySelector('.reset-btn');

    var settings = {
        alignRemainingDragItems: true,
        container: '.container',
        commonDragItemsSettings: {
            selectedItemClassName: 'selected-item',
        },
        dragItems: [
            {
                node: '#item-1',
                data: 2,
                ariaLabel: 'Pyotr Ilyich Tchaikovsky'
            },
            {
                node: '#item-2',
                data: 3,
                ariaLabel: 'Wolfgang Amadeus Mozart'
            },
            {
                node: '#item-3',
                data: 5,
                ariaLabel: 'Ludwig van Beethoven'
            },
            {
                node: '#item-4',
                data: 1,
                ariaLabel: 'Johann Sebastian Bach'
            },
            {
                node: '#item-5',
                data: 4,
                ariaLabel: 'Claude Debussy'
            }
        ],
        dropAreas: [
            {
                node: '#area-1',
                ariaLabel: 'was a German composer and musician of the Baroque period. He is known for instrumental' +
                    ' compositions such as the Art of Fugue, the Brandenburg Concertos, and the Goldberg Variations,' +
                    ' and for vocal music such as the St Matthew Passion and the Mass in B minor.',
                data: 1,
            },
            {
                node: '#area-2',
                ariaLabel: 'was a Russian composer of the romantic period, whose works are among the most popular music' +
                    ' in the classical repertoire. He wrote many works that are popular with the classical music public,' +
                    ' including his Romeo and Juliet, the 1812 Overture, his three ballets (The Nutcracker, Swan Lake,' +
                    ' The Sleeping Beauty) and Marche Slave.',
                data: 2
            },
            {
                node: '#area-3',
                ariaLabel: 'was a prolific and influential composer of the classical era. During his final years in Vienna,' +
                    ' he composed many of his best-known symphonies, concertos, and operas, and portions of the Requiem,' +
                    ' which was largely unfinished at the time of his early death at the age of 35.',
                data: 3
            },
            {
                node: '#area-4',
                ariaLabel: 'was a French composer. His orchestral works include Prélude à l\'après-midi d\'un faune, Nocturnes and Images.',
                data: 4
            },
            {
                node: '#area-5',
                ariaLabel: 'was a German composer and pianist. A crucial figure in the transition between the classical' +
                    ' and romantic eras in classical music, he remains one of the most recognized and influential' +
                    ' musicians of this period, and is considered to be one of the greatest composers of all time.' +
                    ' During his life, he composed nine symphonies; five piano concertos; one violin concerto;' +
                    ' thirty-two piano sonatas; sixteen string quartets; two masses; and the opera Fidelio.,',
                data: 5
            }
        ],
        onDragStop: function (e, params) {
            if (params.dropArea) {
                if (params.dragItem.data === params.dropArea.data) {
                    params.dragItem.correct = true;
                }

                if (params.remainingDragItems[0]) {
                    params.remainingDragItems[0].focus();
                } else {
                    checkButton.focus();
                }
            } else {
                params.dragItem.focus();
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