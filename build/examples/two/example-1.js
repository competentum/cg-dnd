(function () {
  var exampleContainer = document.getElementById('first-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn');

  var settings = {
    bounds: '#second-example',
    //bounds: [0, 0, 800, 600],
    alignRemainingDragItems: true,
    handler: '.handler',
    maxItemsInDropArea: 0,
    possibleToReplaceDroppedItem: true,
    snapAlignParams: {
      horizontalAlign: 'center',
      verticalAlign: 'top',
      withDroppedItemCSSMargins: true
    },
    dragItems: [
      {
        node: '#drag-item-1',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-2',
        data: null,
        ariaLabel: '',
        className: 'drag-item',
      },
      {
        node: '#drag-item-3',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-4',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      },
      {
        node: '#drag-item-5',
        data: null,
        ariaLabel: '',
        className: 'drag-item'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-1',
        ariaLabel: '',
        data: null,
        className: 'drop-area',
      },
      {
        node: '#drop-area-2',
        ariaLabel: '',
        data: null,
        className: 'drop-area',
        snapAlignParams: {
          verticalAlign: 'bottom'
        }
      },
      {
        node: '#drop-area-3',
        ariaLabel: '',
        data: null,
        className: 'drop-area',
        snapAlignParams: {
          verticalAlign: 'center'
        }
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