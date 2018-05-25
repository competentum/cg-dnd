(function () {
  var exampleContainer = document.getElementById('second-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn'),
      CORRECT_ITEM_CLASSNAME = 'correct-item',
      ALL_CORRECT_MESSAGE = 'Congratulations! All drag items are correct.',
      ALL_INCORRECT_MESSAGE = 'All items are incorrect! Try again. ',
      INCORRECT_MESSAGE = 'Some drag items are incorrect, please, set remaining items. ',
      DRAG_START_ITEMS_KEYBOARD_DESC_PART = 'Press space or double touch to place ',
      CORRECT_ITEM_ARIA_DESC = ' Correct! ',
      RESET_MESSAGE = 'Activity was reset! ';

  function changeNotSelectedItemsAriaDesc(dragItems, chosenItem) {
    var chosenItemLabel = chosenItem.getSetting('ariaLabel');

    dragItems.forEach(function (item) {
      if (item !== chosenItem) {
        item.changeCurrentKeyboardDesc(function(item) {
          var direction = item.index > chosenItem.index ? 'below' : 'above';

          return DRAG_START_ITEMS_KEYBOARD_DESC_PART + chosenItemLabel + ' ' + direction + ' this item.';
        });
      }
    });
  }

  function updateItemsDescriptions() {
    dnd.dragItems.forEach(function (item) {
      item.changeCurrentAriaState(function () { return ' Position ' + (item.index + 1) + ' of ' + dnd.dragItems.length + '.' })
    });
  }

  function setCorrectDesc(item) {
    item.changeCurrentAriaState(function () { return CORRECT_ITEM_ARIA_DESC + item.currentAriaState});
  }

  function getCurrentResultMessage(reamainingItems, items) {
    if (!reamainingItems.length) {
      items.forEach(function (item) { item.addClass(CORRECT_ITEM_CLASSNAME) });

      return {
        message: ALL_CORRECT_MESSAGE,
        isAllCorrect: true
      };
    }

    if (reamainingItems.length === items.length) {
      return { message: ALL_INCORRECT_MESSAGE };
    }

    var copy = items.slice(),
        correctMessagePart = ' Correct items are: ',
        incorrectMessagePart = ' Incorrect items are: ',
        commonItemsCount = items.length;

    copy.sort(function (item1, item2) {
      return item1.index > item2.index;
    });

    copy.forEach(function (item) {
      if (item.correct) {
        correctMessagePart += item.getSetting('ariaLabel') + ' - position ' + (item.index + 1) + ' of ' + commonItemsCount + ', ';
      } else {
        incorrectMessagePart += item.getSetting('ariaLabel') + ' - position ' + (item.index + 1) + ' of ' + commonItemsCount + ', ';
      }
    });

    return { message: correctMessagePart + '. ' + incorrectMessagePart + '. ' };
  }


  var settings = {
    bounds: '#dnd-2',
    shiftDragItems: true,
    commonDragItemsSettings: {
      initAriaKeyboardAccessDesc: 'Use arrow keys or swipes to choose item. Press space or double touch to select it.'
    },
    selectedDragItemClassName: 'selected-item',
    container: '#second-example',
    itemsOrderReadingParams: {
      enabled: true,
      liveTextElement: liveRegion,
      usageInstruction: ' Press F2 to read current order of items. ',
      getItemsCurrentOrderDesc: function (currentItems) {
        var itemsOrderDesc = '';

        currentItems.forEach(function (item, index) {
          itemsOrderDesc += item.getSetting('ariaLabel') + ' has position ' + (index + 1) + ' of ' + currentItems.length + '. ';
        });

        return itemsOrderDesc;
      }
    },
    dragItems: [
      {
        node: '#drag-item-2-4',
        data: 3,
        ariaLabel: 'drag item 4 ',
        className: 'custom-class',
        initAriaElementDesc: 'Position 1 of 5. '
      },
      {
        node: '#drag-item-2-2',
        data: 1,
        ariaLabel: 'drag item 2 ',
        className: 'custom-class',
        initAriaElementDesc: 'Position 2 of 5. '
      },
      {
        node: '#drag-item-2-5',
        data: 4,
        ariaLabel: 'drag item 5 ',
        className: 'custom-class',
        initAriaElementDesc: 'Position 3 of 5. '
      },
      {
        node: '#drag-item-2-3',
        data: 2,
        ariaLabel: 'drag item 3 ',
        className: 'custom-class',
        initAriaElementDesc: 'Position 4 of 5. '
      },
      {
        node: '#drag-item-2-1',
        data: 0,
        ariaLabel: 'drag item 1 ',
        className: 'custom-class',
        initAriaElementDesc: 'Position 5 of 5. '
      }
    ],
    onDragStart: function (e, item) {
      changeNotSelectedItemsAriaDesc(dnd.dragItems, item);
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, params) {
      console.log(params)
      dnd.dragItems.forEach(function (item) {item.resetKeyboardDesc()});

      if (params.dragItem1 && params.dragItem2) {
        updateItemsDescriptions();
      }
    },
    onCreate: function (dndObj) {
      console.log(dndObj);
      dndObj.dragItems.forEach(function (item) {
        item.correct = item.index === item.data;
      });
    },
    onDragItemSelect: function (e, params) {
      if (params.dragItem !== params.chosenDraggedItem) {
        this.shuffleDragItems(params.chosenDraggedItem, params.dragItem);
      }
    },
  };

  var dnd = new CgDnd(settings);
  var correctItems = [];

  checkButton.addEventListener('click', function () {
    dnd.dragItems.forEach(function(item) {
      item.correct = item.index === item.data;
      item.correct && item.addClass(CORRECT_ITEM_CLASSNAME);
    });
    dnd.disableFocusOnCorrectItems();

    var result = getCurrentResultMessage(dnd.remainingDragItems, dnd.dragItems);

    if (result.isAllCorrect) {
      setLiveText(result.message);
    } else {
      dnd.remainingFirstDragItem.focus({ liveText: result.message });
    }
  });

  resetButton.addEventListener('click', function () {
    dnd.reset({
      removedClassName: CORRECT_ITEM_CLASSNAME,
      afterAnimationCB: function () {
        /**
         * We call focus after reset end, because on touch devices DOM-root was rebuilding
         */
        dnd.remainingFirstDragItem.focus({ liveText: RESET_MESSAGE });
      }
    });
  });
})();