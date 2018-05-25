
(function () {
  var exampleContainer = document.getElementById('third-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn'),
      CORRECT_ITEM_CLASSNAME = 'correct-item';

  var settings = {
    bounds: '#third-example',
    alignRemainingDragItems: true,
    possibleToReplaceDroppedItem: true,
    selectedDragItemClassName: 'selected-item',
    commonDropAreasSettings: {
      maxItemsInDropArea: 0,
      snapAlignParams: {
        horizontalAlign: 'center',
        verticalAlign: 'top',
        withDroppedItemCSSMargins: true
      },
    },
    commonDragItemsSettings: {
      selectedItemClassName: 'selected-item',
    },
    dragItems: [
      {
        node: '#drag-item-3-1',
        ariaLabel: '',
        className: 'custom-class',
        groups: 'rectangle'
      },
      {
        node: '#drag-item-3-2',
        ariaLabel: '',
        className: 'custom-class',
        groups: ['circle', 'purple']
      },
      {
        node: '#drag-item-3-3',
        ariaLabel: '',
        className: 'custom-class',
        groups: ['rectangle', 'yellow']
      },
      {
        node: '#drag-item-3-4',
        ariaLabel: '',
        className: 'custom-class',
        groups: ['circle', 'yellow', 'yellow-circle']
      },
      {
        node: '#drag-item-3-5',
        ariaLabel: '',
        className: 'custom-class',
        groups: 'circle'
      },
      {
        node: '#drag-item-3-6',
        ariaLabel: '',
        className: 'custom-class',
        groups: ['rectangle', 'purple']
      },
      {
        node: '#drag-item-3-7',
        ariaLabel: '',
        className: 'custom-class',
        groups: ['rectangle', 'purple']
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-3-1',
        ariaLabel: '',
        accept: 'circle',
        className: 'custom-drop-area-class',
      },
      {
        node: '#drop-area-3-2',
        ariaLabel: '',
        accept: 'rectangle',
        className: 'custom-drop-area-class',
      },
      {
        node: '#drop-area-3-3',
        ariaLabel: '',
        accept: ['yellow-circle'],
        className: 'custom-drop-area-class',
        snapAlignParams: {
          horizontalAlign: 'right',
          verticalAlign: 'top',
          withDroppedItemCSSMargins: true,
          eachDroppedItemIndents: [0, 55, 0, 0],
        },
      },
      {
        node: '#drop-area-3-4',
        ariaLabel: '',
        accept: 'purple',
        className: 'custom-drop-area-class',
      }
    ],
    onDragStart: function (e, item) {
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, params) {
      params.dragItem.removeClass(CORRECT_ITEM_CLASSNAME);

      if (params.dropArea) {
        params.dragItem.correct = params.dropArea.checkAccept(params.dragItem);

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
    },
    onDragItemSelect: function (e, params) {
      params.dropAreas[0].focus();
    },
    onDropAreaSelect: function (e, params) {
      if (params.currentDraggedItem) {
        params.currentDraggedItem.putIntoDropArea({
          dropArea: params.dropArea,
          callCheckAfterAnimationEnd: true
        });
      } else if (params.droppedItems.length) {
        params.droppedItems[0].focus();
      }
    }
  };

  var dnd = new CgDnd(settings);

  checkButton.addEventListener('click', function () {
    var areIncorrectItemsExist = false;

    dnd.resetIncorrectItems();
    dnd.dragItems.forEach(function (item) {
      if (item.correct) {
        item.addClass(CORRECT_ITEM_CLASSNAME);
      } else if (!areIncorrectItemsExist) {
        areIncorrectItemsExist = true;
      }
    });

    dnd.remainingFirstDragItem.focus();
  });

  resetButton.addEventListener('click', function () {
    dnd.reset({ removedClassName: CORRECT_ITEM_CLASSNAME });
    dnd.remainingFirstDragItem.focus();
  });
})();