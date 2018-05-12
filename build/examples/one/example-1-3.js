(function () {
  var exampleContainer = document.getElementById('third-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn'),
      disableSwitcher = exampleContainer.querySelector('#disable-switcher'),
      CORRECT_ITEM_CLASSNAME = 'correct-item',
      ALL_CORRECT_MESSAGE = 'Congratulations! All drag items are correct.',
      INCORRECT_MESSAGE = 'Some drag items are incorrect, please, set remaining items. ',
      REPLACE_BY_CHOSEN_DRAG_ITEM_INSTRUCTION = 'Press space (double touch) to replace dropped in drag item by chosen drag item.',
      REPLACE_DROPPED_ITEM_INSTRUCTION = 'Press space (double touch) to select dropped item, that replace it',

      ON_DRAG_START_EMPTY_DROP_AREAS_KEYBOARD_DESC_PART = 'Press space or double touch to place ',
      ON_DRAG_START_FILLED_DROP_AREAS_KEYBOARD_DESC_PART = 'Press space or double touch to replace',
      ON_DRAG_START_SAME_FILLED_DROP_AREA_DESC_PART = 'Press space or double touch to stay ',
      FILLED_DROP_AREA_KEYBOARD_DESC = 'Choose another empty drop area',
      FILLED_DROP_AREA_ARIA_DESC_PART = 'Area was filled by ',
      RESET_MESSAGE = 'Activity was reset';

  function getKeyboardDescForEmptyAreaDuringDragging(dragItemLabel) {
    return ON_DRAG_START_EMPTY_DROP_AREAS_KEYBOARD_DESC_PART + dragItemLabel + ' inside. ';
  }

  function getKeyboardDescForFilledAreaDuringDragging(draggedItem, filledArea) {
    var droppedInItem = filledArea.innerDragItems[0],
        draggedItemLabel = draggedItem.getSetting('ariaLabel'),
        droppedInItemLabel = droppedInItem.getSetting('ariaLabel');

    if (draggedItem === droppedInItem) {
      return ON_DRAG_START_SAME_FILLED_DROP_AREA_DESC_PART + draggedItemLabel + ' inside the same area. ';
    } else {
      return ON_DRAG_START_FILLED_DROP_AREAS_KEYBOARD_DESC_PART + droppedInItemLabel + ' by ' + draggedItemLabel + '. ';
    }
  }

  function getKeyboardDescForFilledArea(filledArea) {
    return ON_DRAG_START_FILLED_DROP_AREAS_KEYBOARD_DESC_PART + filledArea.innerDragItems[0].getSetting('ariaLabel') + '. ';
  }

  function getAriaStateDescForFilledArea(filledArea) {
    return FILLED_DROP_AREA_ARIA_DESC_PART + filledArea.innerDragItems[0].getSetting('ariaLabel') + '. ';
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

  function changeFilledDropAreaDesc(area) {
    area.changeCurrentKeyboardDesc(function () { return getKeyboardDescForFilledArea(area) });
    area.changeCurrentAriaState(function (area) { return getAriaStateDescForFilledArea(area) });
  }

  function setCorrectDesc(area) {
    area.changeCurrentAriaState(function (params) { return 'Correct! ' + params.area.currentAriaState });
  }

  function updateFilledAreasKeyboardDescAfterStopDragging(dropAreas) {
    dropAreas.forEach(function (area) {
      if (area.innerDragItemsCount) {
        area.changeCurrentKeyboardDesc(function () { return getKeyboardDescForFilledArea(area) });
      }
    });
  }

  var settings = {
    disabled: true,
    disabledClassName: 'disabled',
    bounds: '#third-example',
    alignRemainingDragItems: true,
    possibleToReplaceDroppedItem: true,
    container: '#third-example',
    selectedDragItemClassName: 'selected-item',
    commonDropAreasSettings: {
      maxItemsInDropArea: 1,
      snapAlignParams: {
        horizontalAlign: 'center',
        verticalAlign: 'center'
      }
    },
    tooltipParams: {
      html: REPLACE_BY_CHOSEN_DRAG_ITEM_INSTRUCTION,
      className: 'custom-tooltip',
    },
    dragItems: [
      {
        node: '#drag-item-3-1',
        data: 1,
        ariaLabel: 'drag item 1',
        className: 'custom-class',
        groups: ['www', 'something']
      },
      {
        node: '#drag-item-3-2',
        data: 2,
        ariaLabel: 'drag item 2',
        className: 'custom-class',
        groups: 'something'
      },
      {
        node: '#drag-item-3-3',
        data: 3,
        ariaLabel: 'drag item 3',
        className: 'custom-class'
      },
      {
        node: '#drag-item-3-4',
        data: 4,
        ariaLabel: 'drag item 4',
        className: 'custom-class'
      },
      {
        node: '#drag-item-3-5',
        data: 5,
        ariaLabel: 'drag item 5',
        className: 'custom-class'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-3-1',
        ariaLabel: 'drop area 1',
        data: 2,
        className: 'transparent-drop-area'
      },
      {
        node: '#drop-area-3-2',
        ariaLabel: 'drop area 2',
        data: 4,
        className: 'transparent-drop-area',
        //  accept: 'something'
      },
      {
        node: '#drop-area-3-3',
        ariaLabel: 'drop area 3',
        data: 1,
        className: 'transparent-drop-area'
      },
      {
        node: '#drop-area-3-4',
        ariaLabel: 'drop area 4',
        data: 5,
        className: 'transparent-drop-area'
      },
      {
        node: '#drop-area-3-5',
        ariaLabel: 'drop area 5',
        data: 3,
        className: 'transparent-drop-area'
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

        changeFilledDropAreaDesc(params.dropArea);
        updateFilledAreasKeyboardDescAfterStopDragging(dnd.dropAreas);

        if (params.previousDropArea) {
          params.previousDropArea.resetAriaStateDesc();
          params.previousDropArea.resetKeyboardDesc();
        }
      }

      if (params.remainingDragItems[0]) {
        params.remainingDragItems[0].focus();
      } else {
        checkButton.focus();
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
      } else if (params.droppedItems.length) {
        var DELAY = 0;

        params.droppedItems[0].select(DELAY);
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
        setCorrectDesc(item.chosenDropArea);
      } else if (!areIncorrectItemsExist) {
        areIncorrectItemsExist = true;
      }
    });

    if (areIncorrectItemsExist) {
      dnd.remainingFirstDragItem.focus({ liveText: INCORRECT_MESSAGE });
    } else {
      setLiveText(ALL_CORRECT_MESSAGE);
    }
  });

  resetButton.addEventListener('click', function () {
    dnd.reset({ removedClassName: CORRECT_ITEM_CLASSNAME });
    setLiveText(RESET_MESSAGE);
  });

  disableSwitcher.addEventListener('change', function () {
    if (this.checked) {
      dnd.disable();
      checkButton.setAttribute('disabled', true);
      resetButton.setAttribute('disabled', true);
    } else {
      dnd.enable();
      checkButton.removeAttribute('disabled');
      resetButton.removeAttribute('disabled');
    }
  });

  dnd.dropAreas.forEach(function (area) {
    area.node.addEventListener('focus', function () {
      if (area.innerDragItemsCount) {
        if (dnd.currentDragParams) {
          dnd.tooltip.show(area);
        } else {
          dnd.tooltip.show(area, REPLACE_DROPPED_ITEM_INSTRUCTION);
        }
      }
    });

    area.node.addEventListener('focusout', function () {
      if (area.innerDragItemsCount) {
        dnd.tooltip.hide();
      }
    });
  })
})();