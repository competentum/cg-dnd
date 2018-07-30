(function () {
  var exampleContainer = document.getElementById('first-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn'),
      CORRECT_ITEM_CLASSNAME = 'correct-item',
      PUT_DRAG_ITEM_TO_DROP_AREA_INSTRUCTION = 'Press space or double touch to put chosen drag item to this drop area',
      REPLACE_DROPPED_ITEM_VISIBLE_INSTRUCTION = 'Press space button or double touch to start choose dropped item, which you want to replace',
      ARIA_FILLED_AREA_KEYBOARD_INSTRUCTION = 'Press space or double touch to choose and replace dropped items inside. ',
      ON_DRAG_START_EMPTY_DROP_AREAS_KEYBOARD_DESC_PART = 'Press space or double touch to place ',
      ON_DRAG_START_SAME_FILLED_DROP_AREA_DESC_PART = 'Press space or double touch to stay ',
      UNLIMITED_COUNT_DESC = 'This area accept an unlimited items count. ',
      RESET_MESSAGE = 'Activity was reset! ';

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

      return dropAreaStateDesc + ' ' + UNLIMITED_COUNT_DESC;
    });

    dropArea.changeCurrentKeyboardDesc(function () { return ARIA_FILLED_AREA_KEYBOARD_INSTRUCTION });
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
      return 'Use arrow keys or swipes to choose other dropped items, then press spase or double touch to replace it. ';
    });
  }

  function changeDropAreasKeyBoardDescDuringDrag(draggedItem, dropAreas) {
    var draggedItemLabel = draggedItem.getSetting('ariaLabel');

    dropAreas.forEach(function (area) {
      if (!area.innerDragItemsCount) {
        area.changeCurrentKeyboardDesc(function () { return getKeyboardDescForEmptyAreaDuringDragging(draggedItemLabel) });
      } else {
        area.changeCurrentKeyboardDesc(function () { return getKeyboardDescForFilledAreaDuringDragging(draggedItem, area) });
      }
    });
  }

  function getKeyboardDescForEmptyAreaDuringDragging(dragItemLabel) {
    return ON_DRAG_START_EMPTY_DROP_AREAS_KEYBOARD_DESC_PART + dragItemLabel + ' inside. ';
  }

  function getKeyboardDescForFilledAreaDuringDragging(draggedItem, filledArea) {
    var droppedInItem = filledArea.innerDragItems[0],
        draggedItemLabel = draggedItem.getSetting('ariaLabel');

    if (draggedItem === droppedInItem) {
      return ON_DRAG_START_SAME_FILLED_DROP_AREA_DESC_PART + draggedItemLabel + ' inside the same area. ';
    } else {
      return getKeyboardDescForEmptyAreaDuringDragging(draggedItemLabel);
    }
  }

  function updateFilledAreasKeyboardDescAfterStopDragging(dropAreas) {
    dropAreas.forEach(function (area) {
      if (area.innerDragItemsCount) {
        area.changeCurrentKeyboardDesc(function () { return ARIA_FILLED_AREA_KEYBOARD_INSTRUCTION });
      } else {
        setEmptyDropAreaDescription(area);
      }
    });
  }

  function setCorrectDesc(item) {
    item.changeCurrentAriaState(function (params) { return 'Correct! ' + params.item.currentAriaState });
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
      initAriaElementDesc: 'Area is empty. ' + UNLIMITED_COUNT_DESC,
    },
    commonDragItemsSettings: {
      selectedItemClassName: 'selected-item',
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
      changeDropAreasKeyBoardDescDuringDrag(item, dnd.dropAreas);
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, params) {
      params.dragItem.removeClass(CORRECT_ITEM_CLASSNAME);

      if (params.dragItem && params.dropArea) {
        params.dragItem.correct = params.dragItem.data === params.dropArea.data;

        changeDropAreaAriaDescriptions(params.dropArea, params.previousDropArea);
        changeDragItemAriaDescription(params.dragItem);
        updateFilledAreasKeyboardDescAfterStopDragging(dnd.dropAreas);
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
        params.droppedItems[0].focus({ delay: 0 });
      }
    }
  };

  var dnd = new CgDnd(settings);

  checkButton.addEventListener('click', function () {
    dnd.resetIncorrectItems();
    dnd.dragItems.forEach(function (item) {
      if (item.correct) {
        item.addClass(CORRECT_ITEM_CLASSNAME);
        setCorrectDesc(item);
      }
    });

    dnd.dropAreas.forEach(function (area) {
      if (area.innerDragItemsCount) {
        changeDropAreaAriaDescriptions(area);
      }
    });

    var result = getCurrentResultMessage(dnd.remainingDragItems, dnd.dragItems, dnd.dropAreas);

    if (result.isAllCorrect) {
      setLiveText(result.message);
    } else {
      dnd.remainingFirstDragItem.focus({ liveText: result.message });
    }
  });

  resetButton.addEventListener('click', function () {
    dnd.reset({ removedClassName: CORRECT_ITEM_CLASSNAME });
    dnd.remainingFirstDragItem.focus({ liveText: RESET_MESSAGE });
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