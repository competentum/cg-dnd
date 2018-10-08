(function () {
  var exampleContainer = document.getElementById('third-example'),
      resetButton = exampleContainer.querySelector('.reset-btn'),
      CORRECT_ITEM_CLASSNAME = 'correct-item',
      DRAG_START_ITEMS_KEYBOARD_DESC = 'Press space or double touch to replace this item by ',
      CORRECT_ITEM_ARIA_DESC = ' Correct! ',
      CORRECT_ITEM_KEYBOARD_DESC = 'Use arrow keys or swipes to choose another item',
      ALL_CORRECT_MESSAGE = 'Congratulations! All drag items are correct.',
      RESET_MESSAGE = 'Activity was reset! ';

  function changeNotSelectedItemsAriaDesc(dragItems, chosenItem) {
    var chosenItemLabel = chosenItem.getSetting('ariaLabel');

    dragItems.forEach(function (item) {
      if (item !== chosenItem) {
        item.changeCurrentKeyboardDesc(function() {
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
    item.changeCurrentAriaState(function () { return CORRECT_ITEM_ARIA_DESC + item.currentAriaState });
    item.changeCurrentKeyboardDesc(function() { return CORRECT_ITEM_KEYBOARD_DESC });
  }

  function checkOnCorrect(item) {
    item.correct = item.index === item.data;

    if (item.correct) {
      item.addClass(CORRECT_ITEM_CLASSNAME);
      setCorrectDesc(item);
      !item.tooltip.isVisible && item.tooltip.show({ message: 'correct' });
    } else if (item.tooltip.isVisible) {
      item.tooltip.hide();
    }
  }
  function areAllItemsCorrect(items) {
    var areCorrect = true;

    items.forEach(function (item) {
      if (!item.correct) {
        areCorrect = false;
      }
    });

    return areCorrect;
  }

  var settings = {
    bounds: '#dnd-3',
    container: '#third-example',
    commonDragItemsSettings: {
      selectedItemClassName: 'selected-item',
      initialAriaKeyboardDesc: 'Use arrow keys or swipes to choose item. Press space or double touch to select it',
      tooltipParams: {
        location: 'right',
        position: 'end',
        className: CORRECT_ITEM_CLASSNAME
      }
    },
    liveTextElement: liveRegion,
    itemsOrderReadingParams: {
      usageInstruction: ' Press F2 to read current order of items. '
    },
    unselectParams: {
      usageInstruction: ' Press ESC-button to drop current selection. '
    },
    dragItems: [
      {
        node: '#drag-item-3-4',
        data: 3,
        ariaLabel: 'drag item 4 ',
        className: 'custom-class',
        initialAriaElementDesc: 'Position 1 of 5. '
      },
      {
        node: '#drag-item-3-5',
        data: 4,
        ariaLabel: 'drag item 5 ',
        className: 'custom-class',
        initialAriaElementDesc: 'Position 2 of 5. '
      },
      {
        node: '#drag-item-3-2',
        data: 1,
        ariaLabel: 'drag item 2 ',
        className: 'custom-class',
        initialAriaElementDesc: 'Position 3 of 5. '
      },
      {
        node: '#drag-item-3-3',
        data: 2,
        ariaLabel: 'drag item 3 ',
        className: 'custom-class',
        initialAriaElementDesc: 'Position 4 of 5. '
      },
      {
        node: '#drag-item-3-1',
        data: 0,
        ariaLabel: 'drag item 1 ',
        className: 'custom-class',
        initialAriaElementDesc: 'Position 5 of 5. '
      }
    ],
    onDragStart: function (e, item) {
      console.log('start')
      item.removeClass(CORRECT_ITEM_CLASSNAME);
      item.resetAriaStateDesc();
      item.resetKeyboardDesc();
      item.tooltip.isVisible && item.tooltip.hide();
      changeNotSelectedItemsAriaDesc(dnd.dragItems, item);

      if (!DEVICES.IS_FF && item === dnd.currentDragParams.chosenDraggedItem) {
        setLiveText('selected');
      }
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, params) {
      dnd.dragItems.forEach(function (item) { item.resetKeyboardDesc() });

      if (params.dragItem1 && params.dragItem2) {
        params.dragItem1.removeClass(CORRECT_ITEM_CLASSNAME);
        params.dragItem2.removeClass(CORRECT_ITEM_CLASSNAME);

        replaceItemsDescriptions(params.dragItem1, params.dragItem2);
        checkOnCorrect(params.dragItem1);
        checkOnCorrect(params.dragItem2);
      } else {
        /** User dropped current selection */
        params.dragItem.focus();
      }
    },
    onCreate: function (dndObj) {
      console.log(dndObj);
    },
    onDragItemSelect: function (e, params) {
      if (params.chosenDraggedItem !== params.dragItem && !params.chosenDraggedItem.disabled && !params.dragItem.disabled) {
        this.shuffleDragItems(params.chosenDraggedItem, params.dragItem, function (item1, item2) {
          var item2CorrectPart = item2.correct ? 'correct' : '',
              feedback = areAllItemsCorrect(dnd.dragItems)
                ? ALL_CORRECT_MESSAGE
                : 'The ' + item2.getSetting('ariaLabel') + ' was translated to ' + item2CorrectPart + ' position ' + (item2.index + 1) + ' of 5';

          item1.focus();
          setLiveText(feedback);
        });
      }
    },
  };

  var dnd = new CgDnd(settings);

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