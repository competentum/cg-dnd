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
    tooltipParams: {
      html: 'custom tooltip',
      className: 'custom-tooltip',
    },
    dragItems: [
      {
        node: '#drag-item-1',
        data: 1,
        ariaLabel: '',
        className: 'drag-item',
        groups: ['www', 'something']
      },
      {
        node: '#drag-item-2',
        data: 2,
        ariaLabel: '',
        className: 'drag-item',
        groups: 'something'
      },
      {
        node: '#drag-item-3',
        data: 3,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-4',
        data: 4,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-5',
        data: 5,
        ariaLabel: '',
        className: 'drag-item'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-1',
        ariaLabel: '',
        data: 2,
        className: 'drop-area'
      },
      {
        node: '#drop-area-2',
        ariaLabel: '',
        data: 4,
        className: 'drop-area',
        //  accept: 'something'
      },
      {
        node: '#drop-area-3',
        ariaLabel: '',
        data: 1,
        className: 'drop-area'
      },
      {
        node: '#drop-area-4',
        ariaLabel: '',
        data: 5,
        className: 'drop-area'
      },
      {
        node: '#drop-area-5',
        ariaLabel: '',
        data: 3,
        className: 'drop-area'
      }
    ],
    onDragStart: function (e, item) {
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, dragItem, dropArea) {
      if (dragItem && dropArea && dragItem.data === dropArea.data) {
        dragItem.correct = true;
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