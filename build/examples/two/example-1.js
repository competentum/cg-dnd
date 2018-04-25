(function () {
  var exampleContainer = document.getElementById('first-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn'),
      PUT_DRAG_ITEM_TO_DROP_AREA_INSTRUCTION = 'Press space or double touch to put chosen drag item to this drop area',
      REPLACE_DROPPED_ITEM_VISIBLE_INSTRUCTION = 'Press space button or double touch to start choose dropped item, which you want to replace';

  function changeDropAreaAriaDescriptions(dropArea, previousDropArea) {
    if (dropArea.innerDragItems.length) {
      setFilledDropAreaDescription(dropArea);
    } else {
      setEmptyDropAreaDescription(dropArea);
    }

    if (previousDropArea) {
      changeDropAreaAriaDescriptions(previousDropArea);
    }
  }

  function setFilledDropAreaDescription(dropArea) {
    dropArea.changeCurrentAriaState(function (params) {
      var dropAreaStateDesc = 'Area contains';

      params.innerDragItems.forEach(function (innerItem, index) {
        dropAreaStateDesc += ' ' + innerItem.getSetting('ariaLabel') + (index + 1 === params.innerDragItems.length ? '.' : ',');
      });

      return dropAreaStateDesc;
    });

    dropArea.changeCurrentKeyboardDesc(function () {
      return 'Press space or double touch to put current drag item or to choose dropped items inside. ';
    });
  }

  function setEmptyDropAreaDescription(dropArea) {
    dropArea.resetAriaStateDesc();
    dropArea.resetKeyboardDesc();
  }

  function changeDragItemAriaDescription(dragItem) {
    dragItem.changeCurrentAriaState(function (params) {
      if (params.chosenDropArea) {
        return ' Item was placed in ' + params.chosenDropArea.getSetting('ariaLabel');
      }

      return '';
    });

    dragItem.changeCurrentKeyboardDesc(function () {
      return 'Use arrow keys or swipes to choose other dropped items, then press cpase or double touch to replace it. ';
    });
  }

  var settings = {
    bounds: '#first-example',
    alignRemainingDragItems: true,
    possibleToReplaceDroppedItem: true,
    commonDropAreasSettings: {
      maxItemsInDropArea: 0,
      snapAlignParams: {
        horizontalAlign: 'center',
        verticalAlign: 'top',
        withDroppedItemCSSMargins: true
      },
      initAriaKeyboardAccessDesc: 'Press space or double touch to put drag item inside. ',
      initAriaElementDesc: 'Area is empty. ',
    },
    commonDragItemsSettings: {
      initAriaKeyboardAccessDesc: 'Use arrow keys or swipes to choose other drag items, then press spase or double touch to drag it. '
    },
    container: '#first-example',
    dragItems: [
      {
        node: '#drag-item-1',
        data: 'first',
        ariaLabel: 'drag item 1',
        className: 'custom-class'
      },
      {
        node: '#drag-item-2',
        data: 'second',
        ariaLabel: 'drag item 2',
        className: 'custom-class',
      },
      {
        node: '#drag-item-3',
        data: 'third',
        ariaLabel: 'drag item 3',
        className: 'custom-class'
      },
      {
        node: '#drag-item-4',
        data: 'third',
        ariaLabel: 'drag item 4',
        className: 'custom-class'
      },
      {
        node: '#drag-item-5',
        data: 'third',
        ariaLabel: 'drag item 5',
        className: 'custom-class'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-1',
        ariaLabel: 'drop area 1',
        data: 'first',
        className: 'custom-drop-area-class',
      },
      {
        node: '#drop-area-2',
        ariaLabel: 'drop area 2',
        data: 'second',
        className: 'custom-drop-area-class',
        snapAlignParams: {
          verticalAlign: 'bottom'
        }
      },
      {
        node: '#drop-area-3',
        ariaLabel: 'drop area 3',
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
      if (params.dragItem && params.dropArea) {
        params.dragItem.correct = params.dragItem.data === params.dropArea.data;

        changeDropAreaAriaDescriptions(params.dropArea, params.previousDropArea);
        changeDragItemAriaDescription(params.dragItem);
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

  dnd.dropAreas.forEach(function (area) {
    area.node.addEventListener('focus', function () {
      if (area.innerDragItemsCount && !dnd.currentDragParams) {
        dnd.tooltip.show(area, REPLACE_DROPPED_ITEM_VISIBLE_INSTRUCTION);
      } else if (dnd.currentDragParams) {
        dnd.tooltip.show(area, PUT_DRAG_ITEM_TO_DROP_AREA_INSTRUCTION);
      }
    });

    area.node.addEventListener('focusout', function () {
      if (area.innerDragItemsCount) {
        dnd.tooltip.hide();
      }
    });
  });

  dnd.dragItems.forEach(function (item) {
    item.node.addEventListener('focus', function () {
      dnd.tooltip.show(item);
    });

    item.node.addEventListener('focusout', function () {
      dnd.tooltip.hide();
    });
  });
})();