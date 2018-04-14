(function () {
  var exampleContainer = document.getElementById('first-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn');

  var settings = {
    bounds: '#first-example',
    //bounds: [0, 0, 800, 600],
    alignRemainingDragItems: true,
    possibleToReplaceDroppedItem: true,
    commonDropAreasSettings: {
      maxItemsInDropArea: 0,
      snapAlignParams: {
        horizontalAlign: 'center',
        verticalAlign: 'top',
        withDroppedItemCSSMargins: true
      },
    },
    dragItems: [
      {
        node: '#drag-item-1',
        data: 'first',
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-2',
        data: 'second',
        ariaLabel: '',
        className: 'custom-class',
      },
      {
        node: '#drag-item-3',
        data: 'third',
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-4',
        data: 'third',
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-5',
        data: 'third',
        ariaLabel: '',
        className: 'custom-class'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-1',
        ariaLabel: '',
        data: 'first',
        className: 'custom-drop-area-class',
      },
      {
        node: '#drop-area-2',
        ariaLabel: '',
        data: 'second',
        className: 'custom-drop-area-class',
        snapAlignParams: {
          verticalAlign: 'bottom'
        }
      },
      {
        node: '#drop-area-3',
        ariaLabel: '',
        data: 'third',
        className: 'custom-drop-area-class',
        snapAlignParams: {
          verticalAlign: 'center'
        }
      }
    ],
    onDragStart: function (e, item) {
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, params) {
      console.log('stop')
      if (params.dragItem && params.dropArea) {
        params.dragItem.correct = params.dragItem.data === params.dropArea.data;
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