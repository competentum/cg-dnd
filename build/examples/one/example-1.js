(function () {
  var exampleContainer = document.getElementById('first-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn'),
      DRAG_START_DROP_AREAS_KEYBOARD_DESC_PART = 'Press space or double touch to place ',
      FILLED_DROP_AREA_KEYBOARD_DESC = 'Choose another empty drop area',
      FILLED_DROP_AREA_ARIA_DESC_PART = 'Area was filled by ',
      RESET_MESSAGE = 'Activity was reset! ';

  function changeDropAreasKeyBoardDescDuringDrag(draggedItem, dropAreas) {
    var draggedItemLabel = draggedItem.getSetting('ariaLabel');

    dropAreas.forEach(function (area) {
      if (!area.innerDragItemsCount) {
        area.changeCurrentKeyboardDesc(function () { return DRAG_START_DROP_AREAS_KEYBOARD_DESC_PART + draggedItemLabel + ' inside' });
      }
    });
  }

  function changeFilledDropAreaDesc(area) {
    area.changeCurrentKeyboardDesc(function () { return FILLED_DROP_AREA_KEYBOARD_DESC });
    area.changeCurrentAriaState(function (area) { return FILLED_DROP_AREA_ARIA_DESC_PART + area.innerDragItems[0].getSetting('ariaLabel') });
  }

  function setCorrectDesc(area) {
    area.changeCurrentAriaState(function (params) { return 'Correct! ' + params.area.currentAriaState });
  }

  var settings = {
    bounds: '#first-example',
    alignRemainingDragItems: true,
    container: '#first-example',
    liveTextElement: liveRegion,
    unselectParams: {
      usageInstruction: ' Press ESC-button to drop current selection. '
    },
    commonDragItemsSettings: {
      handler: '.handler',
      selectedItemClassName: 'selected-item',
    },
    commonDropAreasSettings: {
      initAriaElementDesc: 'Area is empty. '
    },
    dragItems: [
      {
        node: '#drag-item-1',
        data: 1,
        ariaLabel: 'drag item 1',
        className: 'custom-class',
      },
      {
        node: '#drag-item-2',
        data: 2,
        ariaLabel: 'drag item 2',
        className: 'custom-class'
      },
      {
        node: '#drag-item-3',
        data: 3,
        ariaLabel: 'drag item 3',
        className: 'custom-class'
      },
      {
        node: '#drag-item-4',
        data: 4,
        ariaLabel: 'drag item 4',
        className: 'custom-class'
      },
      {
        node: '#drag-item-5',
        data: 5,
        ariaLabel: 'drag item 5',
        className: 'custom-class'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-1',
        ariaLabel: 'drop area 1',
        data: 2,
        className: 'custom-drop-area-class'
      },
      {
        node: '#drop-area-2',
        ariaLabel: 'drop area 2',
        data: 4,
        className: 'custom-drop-area-class'
      },
      {
        node: '#drop-area-3',
        ariaLabel: 'drop area 3',
        data: 1,
        className: 'custom-drop-area-class'
      },
      {
        node: '#drop-area-4',
        ariaLabel: 'drop area 4',
        data: 5,
        className: 'custom-drop-area-class'
      },
      {
        node: '#drop-area-5',
        ariaLabel: 'drop area 5',
        data: 3,
        className: 'custom-drop-area-class'
      }
    ],
    onDragStart: function (e, item) {
      changeDropAreasKeyBoardDescDuringDrag(item, dnd.dropAreas);
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, params) {
      dnd.dragItems.forEach(function (item) {item.resetKeyboardDesc()});

      if (params.dropArea) {
        if (params.dragItem.data === params.dropArea.data) {
          params.dragItem.correct = true;
        }

        changeFilledDropAreaDesc(params.dropArea);

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
      }
    }
  };

  var dnd = new CgDnd(settings);

  checkButton.addEventListener('click', function () {
    dnd.resetIncorrectItems();
    dnd.dragItems.forEach(function (item) {
      if (item.correct) {
        item.addClass('correct-item');
        setCorrectDesc(item.chosenDropArea);
      }
    });

    var result = getCurrentResultMessage(dnd.remainingDragItems, dnd.dragItems);

    if (result.isAllCorrect) {
      setLiveText(result.message);
    } else {
      dnd.remainingFirstDragItem.focus({ liveText: result.message });
    }
  });

  resetButton.addEventListener('click', function () {
    dnd.reset({ removedClassName: 'correct-item' });
    dnd.remainingFirstDragItem.focus({ liveText: RESET_MESSAGE });
  });
})();