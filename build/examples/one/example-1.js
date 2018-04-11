(function () {
  var exampleContainer = document.getElementById('first-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn');

  var settings = {
    bounds: '#first-example',
    //bounds: [0, 0, 800, 600],
    alignRemainingDragItems: true,
    handler: '.handler',
    maxItemsInDropArea: 1,
    container: '#first-example',
    tooltipParams: {
      html: 'custom tooltip',
      className: 'custom-tooltip',
    },
    dragItems: [
      {
        node: '#drag-item-1',
        data: 1,
        ariaLabel: 'aa',
        ariaDescribedBy: 'xm',
        className: 'custom-class',
        groups: ['www', 'something']
      },
      {
        node: '#drag-item-2',
        data: 2,
        ariaLabel: '',
        className: 'custom-class',
        groups: 'something'
      },
      {
        node: '#drag-item-3',
        data: 3,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-4',
        data: 4,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-5',
        data: 5,
        ariaLabel: '',
        className: 'custom-class'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-1',
        ariaLabel: '',
        data: 2,
        className: 'custom-drop-area-class'
      },
      {
        node: '#drop-area-2',
        ariaLabel: '',
        data: 4,
        className: 'custom-drop-area-class',
        //  accept: 'something'
      },
      {
        node: '#drop-area-3',
        ariaLabel: '',
        data: 1,
        className: 'custom-drop-area-class'
      },
      {
        node: '#drop-area-4',
        ariaLabel: '',
        data: 5,
        className: 'custom-drop-area-class'
      },
      {
        node: '#drop-area-5',
        ariaLabel: '',
        data: 3,
        className: 'custom-drop-area-class'
      }
    ],
    onDragStart: function (e, item) {
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, params) {
      if (params.dragItem && params.dropArea && params.dragItem.data === params.dropArea.data) {
        params.dragItem.correct = true;
      }
    },
    onCreate: function (dndObj) {
      console.log(dndObj);
    },
    onDragItemSelect: function (e, params) {
      params.dropAreas[0].focus();
    },
    onDropAreaSelect: function (e, params) {
      if (params.currentDraggedItem) {
        params.currentDraggedItem.putIntoDropArea(params.dropArea);

        if (params.remainingDragItems[0]) {
          params.remainingDragItems[0].focus();
        } else {
          checkButton.focus();
        }
      }
    }
  };

  var dnd = new CgDnd(settings);

  checkButton.addEventListener('click', function () {
    dnd.resetIncorrectItems();
  });

  resetButton.addEventListener('click', function () {
    dnd.reset();
  });
})();