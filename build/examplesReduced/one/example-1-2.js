(function () {
  var exampleContainer = document.getElementById('second-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn'),
      DRAG_START_DROP_AREAS_KEYBOARD_DESC_PART = 'Press space or double touch to place ',
      RESET_MESSAGE = 'Activity was reset! ';

  function changeDropAreasKeyBoardDescDuringDrag(draggedItem, dropAreas) {
    var draggedItemLabel = draggedItem.getSetting('ariaLabel');

    dropAreas.forEach(function (area) {
      if (!area.innerDragItemsCount) {
        area.changeCurrentKeyboardDesc(function () { return DRAG_START_DROP_AREAS_KEYBOARD_DESC_PART + draggedItemLabel + ' inside' });
      }
    });
  }

  var settings = {
    bounds: '#second-example',
    forbidFocusOnFilledDropAreas: true,
    container: '#second-example',
    unselectParams: {
      usageInstruction: ' Press ESC-button to drop current selection. '
    },
    commonDragItemsSettings: {
      selectedItemClassName: 'selected-item'
    },
    commonDropAreasSettings: {
      initialAriaElementDesc: 'Area is empty. '
    },
    dragItems: [
      {
        node: '#drag-item-2-1',
        data: 1,
        ariaLabel: 'drag item 1',
        className: 'custom-class',
        groups: ['www', 'something']
      },
      {
        node: '#drag-item-2-2',
        data: 2,
        ariaLabel: 'drag item 2',
        className: 'custom-class',
        groups: 'something'
      },
      {
        node: '#drag-item-2-3',
        data: 3,
        ariaLabel: 'drag item 3',
        className: 'custom-class'
      },
      {
        node: '#drag-item-2-4',
        data: 4,
        ariaLabel: 'drag item 4',
        className: 'custom-class'
      },
      {
        node: '#drag-item-2-5',
        data: 5,
        ariaLabel: 'drag item 5',
        className: 'custom-class'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-2-1',
        ariaLabel: 'drop area 1',
        data: 2,
        className: 'custom-drop-area-class'
      },
      {
        node: '#drop-area-2-2',
        ariaLabel: 'drop area 2',
        data: 4,
        className: 'custom-drop-area-class',
        //  accept: 'something'
      },
      {
        node: '#drop-area-2-3',
        ariaLabel: 'drop area 3',
        data: 1,
        className: 'custom-drop-area-class'
      },
      {
        node: '#drop-area-2-4',
        ariaLabel: 'drop area 4',
        data: 5,
        className: 'custom-drop-area-class'
      },
      {
        node: '#drop-area-2-5',
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
      dnd.dropAreas.forEach(function (area) { area.resetKeyboardDesc() });

      if (params.dragItem && params.dropArea && params.dragItem.data === params.dropArea.data) {
        params.dragItem.correct = true;
      }

      if (params.remainingDragItems[0]) {
        params.remainingDragItems[0].focus();
      } else {
        checkButton.focus();
      }
    },
    onCreate: function (dndObj) {
      console.log(dndObj);
    }
  };

  var dnd = new CgDnd(settings);

  checkButton.addEventListener('click', function () {
    dnd.resetIncorrectItems();
    dnd.dragItems.forEach(function (item) {
      if (item.correct) {
        item.addClass('correct-item');
      }
    });

    var result = getCurrentResultMessage(dnd.remainingDragItems, dnd.dragItems);

    if (result.isAllCorrect) {
      setLiveText(result.message);
    } else {
      dnd.firstRemainingDragItem.focus({ liveText: result.message });
    }
  });

  resetButton.addEventListener('click', function () {
    dnd.reset({ removedClassName: 'correct-item' });
    dnd.firstRemainingDragItem.focus({ liveText: RESET_MESSAGE });
  });
})();