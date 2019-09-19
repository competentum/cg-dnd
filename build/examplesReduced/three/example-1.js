(function () {
  var exampleContainer = document.getElementById('first-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn'),
      CORRECT_ITEM_CLASSNAME = 'correct-item',
      DRAG_START_ITEMS_KEYBOARD_DESC = 'Press space or double touch to replace this item by ',
      CORRECT_ITEM_ARIA_DESC = ' Correct! ',
      INCORRECT_MESSAGE = 'Some drag items are incorrect, please, set remaining items. ',
      RESET_MESSAGE = 'Activity was reset! ';

  function changeNotSelectedItemsAriaDesc(dragItems, chosenItem) {
    var chosenItemLabel = chosenItem.getSetting('ariaLabel');

    dragItems.forEach(function (item) {
      if (item !== chosenItem) {
        item.changeCurrentKeyboardDesc(function(item) {
          return DRAG_START_ITEMS_KEYBOARD_DESC + chosenItemLabel;
        });
      }
    });
  }

  function replaceItemsDescriptions(item1, item2) {
    var item1CurrentDesc = item1.currentAriaState,
        item2CurrentDesc = item2.currentAriaState;

    item1.changeCurrentAriaState(function () { return item2CurrentDesc });
    item2.changeCurrentAriaState(function () { return item1CurrentDesc });
  }

  function setCorrectDesc(item) {
    item.changeCurrentAriaState(function () { return CORRECT_ITEM_ARIA_DESC + item.currentAriaState});
  }

  var settings = {
    bounds: '#dnd-1',
    alignRemainingDragItems: true,
    commonDragItemsSettings: {
      selectedItemClassName: 'selected-item',
      initialAriaKeyboardDesc: 'Use arrow keys or swipes to choose item. Press space or double touch to select it.',
      tooltipParams: {
        location: 'right',
        position: 'center',
        className: CORRECT_ITEM_CLASSNAME
      }
    },
    selectedDragItemClassName: 'selected-item',
    container: '#first-example',
    liveTextElement: liveRegion,
    itemsOrderReadingParams: {
      usageInstruction: ' Press F2 to read current order of items. '
    },
    unselectParams: {
      usageInstruction: ' Press ESC-button to drop current selection. '
    },
    dragItems: [
      {
        node: '#drag-item-4',
        data: 3,
        ariaLabel: 'drag item 4 ',
        className: 'custom-class',
        initialAriaElementDesc: 'Position 1 of 5. '
      },
      {
        node: '#drag-item-2',
        data: 1,
        ariaLabel: 'drag item 2 ',
        className: 'custom-class',
        initialAriaElementDesc: 'Position 2 of 5. '
      },
      {
        node: '#drag-item-5',
        data: 4,
        ariaLabel: 'drag item 5 ',
        className: 'custom-class',
        initialAriaElementDesc: 'Position 3 of 5. '
      },
      {
        node: '#drag-item-3',
        data: 2,
        ariaLabel: 'drag item 3 ',
        className: 'custom-class',
        initialAriaElementDesc: 'Position 4 of 5. '
      },
      {
        node: '#drag-item-1',
        data: 0,
        ariaLabel: 'drag item 1 ',
        className: 'custom-class',
        initialAriaElementDesc: 'Position 5 of 5. '
      }
    ],
    onDragStart: function (e, item) {
      changeNotSelectedItemsAriaDesc(dnd.dragItems, item);

      if (!DEVICES.IS_FF && item === dnd.currentDragParams.chosenDraggedItem) {
        setLiveText('selected');
      }
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, params) {
      dnd.dragItems.forEach(function (item) {item.resetKeyboardDesc()});

      if (params.dragItem1 && params.dragItem2) {
        replaceItemsDescriptions(params.dragItem1, params.dragItem2);
      } else {
        /** User dropped current selection */
        params.dragItem && params.dragItem.focus();
      }
    },
    onCreate: function (dndObj) {
      console.log(dndObj);
    },
  };

  var dnd = new CgDnd(settings);
  var correctItems = [];

  checkButton.addEventListener('click', function () {
    dnd.dragItems.forEach(function(item) {
      item.correct = item.index === item.data;

      if (item.correct) {
        item.addClass(CORRECT_ITEM_CLASSNAME);
        !item.tooltip.isVisible && item.tooltip.show({ message: 'correct' });
      }
    });
    dnd.disableFocusOnCorrectItems();

    var result = getCurrentResultMessage(dnd.remainingDragItems, dnd.dragItems, true);

    if (result.isAllCorrect) {
      setLiveText(result.message);
    } else {
      dnd.firstRemainingDragItem.focus({ liveText: result.message });
    }
  });

  resetButton.addEventListener('click', function () {
    dnd.reset({
      removedClassName: CORRECT_ITEM_CLASSNAME,
      afterAnimationCB: function () {
        /**
         * We call focus after reset end, because on touch devices DOM-root was rebuilding
         */
        dnd.firstRemainingDragItem.focus({ liveText: RESET_MESSAGE });
      }
    });

    dnd.dragItems.forEach(function(item) {
      item.tooltip.isVisible && item.tooltip.hide();
    });
  });
})();