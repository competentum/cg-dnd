(function () {
  var exampleContainer = document.getElementById('second-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn');

  var settings = {
    bounds: '#second-example',
    //bounds: [0, 0, 800, 600],
    alignRemainingDragItems: true,
    selectedDragItemClassName: 'selected-item',
    commonDropAreasSettings: {
      snapAlignParams: {
        horizontalAlign: 'center',
        verticalAlign: 'top',
        withDroppedItemCSSMargins: true
      }
    },
    dragItems: [
      {
        node: '#drag-item-2-1',
        data: 'first',
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-2-2',
        data: 'second',
        ariaLabel: '',
        className: 'custom-class',
      },
      {
        node: '#drag-item-2-3',
        data: 'third',
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-2-4',
        data: 'third',
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-2-5',
        data: 'third',
        ariaLabel: '',
        className: 'custom-class'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-2-1',
        ariaLabel: '',
        data: 'first',
        className: 'custom-drop-area-class',
        maxItemsInDropArea: 2,
        snapAlignParams: {
          withShift: false,
          horizontalAlign: 'left',
          verticalAlign: 'top',
          withDroppedItemCSSMargins: true
        },
      },
      {
        node: '#drop-area-2-2',
        ariaLabel: '',
        data: 'second',
        className: 'custom-drop-area-class',
        maxItemsInDropArea: 2,
        snapAlignParams: {
          verticalAlign: 'bottom',
          horizontalAlign: 'right',
          eachDroppedItemIndents: [40, 10],
        }
      },
      {
        node: '#drop-area-2-3',
        ariaLabel: '',
        data: 'third',
        className: 'custom-drop-area-class',
        maxItemsInDropArea: 4,
        snapAlignParams: {
          verticalAlign: 'center',
          horizontalAlign: 'center',
          withDroppedItemCSSMargins: false
        }
      },
      {
        node: '#drop-area-2-4',
        ariaLabel: '',
        data: 'fourth',
        className: 'custom-drop-area-class',
        maxItemsInDropArea: 0,
        snap: false
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
        params.currentDraggedItem.putIntoDropArea({ dropArea: params.dropArea });

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