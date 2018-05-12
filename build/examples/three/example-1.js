(function () {
  var exampleContainer = document.getElementById('first-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn'),
      CORRECT_ITEM_CLASSNAME = 'correct-item',
      DRAG_START_ITEMS_KEYBOARD_DESC = 'Press space or double touch to replace this item by ',
      CORRECT_ITEM_ARIA_DESC = ' Correct! ',
      ALL_CORRECT_MESSAGE = 'Congratulations! All drag items are correct.',
      INCORRECT_MESSAGE = 'Some drag items are incorrect, please, set remaining items. ',
      RESET_MESSAGE = 'Activity was reset';

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

  function checkOnCorrect(item, correctItemsArray) {
    item.correct = item.index === item.data;

    if (item.correct) {
      correctItemsArray.push(item);
    }
  }

  var settings = {
    bounds: '#dnd-1',
    alignRemainingDragItems: true,
    tooltipParams: {
      html: 'custom tooltip',
      className: 'custom-tooltip',
    },
    commonDragItemsSettings: {
      initAriaKeyboardAccessDesc: 'Use arrow keys or swipes to choose item. Press space or double touch to select it'
    },
    selectedDragItemClassName: 'selected-item',
    container: '#first-example',
    dragItems: [
      {
        node: '#drag-item-4',
        data: 3,
        ariaLabel: 'drag item 4 ',
        className: 'custom-class',
        initAriaElementDesc: 'Position 1 of 5. '
      },
      {
        node: '#drag-item-2',
        data: 1,
        ariaLabel: 'drag item 2 ',
        className: 'custom-class',
        initAriaElementDesc: 'Position 2 of 5. '
      },
      {
        node: '#drag-item-5',
        data: 4,
        ariaLabel: 'drag item 5 ',
        className: 'custom-class',
        initAriaElementDesc: 'Position 3 of 5. '
      },
      {
        node: '#drag-item-3',
        data: 2,
        ariaLabel: 'drag item 3 ',
        className: 'custom-class',
        initAriaElementDesc: 'Position 4 of 5. '
      },
      {
        node: '#drag-item-1',
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
        checkOnCorrect(params.dragItem1, correctItems);
        checkOnCorrect(params.dragItem2, correctItems);

        replaceItemsDescriptions(params.dragItem1, params.dragItem2);
      }
    },
    onCreate: function (dndObj) {
      console.log(dndObj);
      dndObj.dragItems.forEach(function (item) {
        item.correct = item.index === item.data;
      });
    },
    onDragItemSelect: function (e, params) {
      if (params.chosenDraggedItem && params.dragItem !== params.chosenDraggedItem) {
        this.shuffleDragItems(params.dragItem, params.chosenDraggedItem);
      }
    },
  };

  var dnd = new CgDnd(settings);
  var correctItems = [];

  checkButton.addEventListener('click', function () {
    var areIncorrectItemsExist = false;

    dnd.dragItems.forEach(function(item) {
      item.correct = item.index === item.data;

      if (item.correct) {
        item.addClass(CORRECT_ITEM_CLASSNAME);
      } else if (!areIncorrectItemsExist) {
        areIncorrectItemsExist = true;
      }
    });
    dnd.disableFocusOnCorrectItems();

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
})();