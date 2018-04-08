(function () {
  var exampleContainer = document.getElementById('third-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn');

  var settings = {
    bounds: '#third-example',
    alignRemainingDragItems: true,
    possibleToReplaceDroppedItem: true,
    handler: '.handler',
    maxItemsInDropArea: 1,
    tooltipParams: {
      html: 'custom tooltip',
      className: 'custom-tooltip',
    },
    snapAlignParams: {
      horizontalAlign: 'center',
      verticalAlign: 'center'
    },
    dragItems: [
      {
        node: '#drag-item-3-1',
        data: 1,
        ariaLabel: '',
        className: 'drag-item',
        groups: ['www', 'something']
      },
      {
        node: '#drag-item-3-2',
        data: 2,
        ariaLabel: '',
        className: 'drag-item',
        groups: 'something'
      },
      {
        node: '#drag-item-3-3',
        data: 3,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-3-4',
        data: 4,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-3-5',
        data: 5,
        ariaLabel: '',
        className: 'drag-item'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-3-1',
        ariaLabel: '',
        data: 2,
        className: 'transparent-drop-area'
      },
      {
        node: '#drop-area-3-2',
        ariaLabel: '',
        data: 4,
        className: 'transparent-drop-area',
        //  accept: 'something'
      },
      {
        node: '#drop-area-3-3',
        ariaLabel: '',
        data: 1,
        className: 'transparent-drop-area'
      },
      {
        node: '#drop-area-3-4',
        ariaLabel: '',
        data: 5,
        className: 'transparent-drop-area'
      },
      {
        node: '#drop-area-3-5',
        ariaLabel: '',
        data: 3,
        className: 'transparent-drop-area'
      }
    ],
    onDragStart: function (e, item) {
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, dragItem, dropArea) {
      console.log('stop')
      if (dragItem && dropArea) {
        dragItem.correct = dragItem.data === dropArea.data;
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
      } else if (params.droppedItems.length) {
          params.droppedItems[0].focus();
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