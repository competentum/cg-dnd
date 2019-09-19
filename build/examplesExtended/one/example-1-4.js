(function () {
  var ALL_CORRECT_MESSAGE = 'Congratulations! All drag items are correct.',
      CORRECT_MESSAGE = 'Correct! ',
      INCORRECT_MESSAGE = 'Incorrect! Try again. ',
      DRAG_START_DROP_AREAS_KEYBOARD_DESC_PART = 'Press space or double touch to place ',
      VISUALLY_DELAY = 1100;

  function changeDropAreasKeyBoardDescDuringDrag(draggedItem, dropAreas) {
    var draggedItemLabel = draggedItem.getSetting('ariaLabel');

    dropAreas.forEach(function (area) {
      if (!area.innerDragItemsCount) {
        area.changeCurrentKeyboardDesc(function () { return DRAG_START_DROP_AREAS_KEYBOARD_DESC_PART + draggedItemLabel + ' inside' });
      }
    });
  }

  var settings = {
    bounds: '#fourth-example',
    alignRemainingDragItems: true,
    forbidFocusOnFilledDropAreas: true,
    container: '#fourth-example',
    unselectParams: {
      usageInstruction: ' Press ESC-button to drop current selection. '
    },
    commonDragItemsSettings: {
      selectedItemClassName: 'selected-item'
    },
    dragItems: [
      {
        node: '#drag-item-4-1',
        data: 1,
        ariaLabel: 'drag item 1',
        className: 'custom-class'
      },
      {
        node: '#drag-item-4-2',
        data: 2,
        ariaLabel: 'drag item 2',
        className: 'custom-class',
        groups: 'something'
      },
      {
        node: '#drag-item-4-3',
        data: 3,
        ariaLabel: 'drag item 3',
        className: 'custom-class'
      },
      {
        node: '#drag-item-4-4',
        data: 4,
        ariaLabel: 'drag item 4',
        className: 'custom-class'
      },
      {
        node: '#drag-item-4-5',
        data: 5,
        ariaLabel: 'drag item 5',
        className: 'custom-class'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-4-1',
        ariaLabel: 'drop area 1',
        data: 2,
        className: 'custom-class'
      },
      {
        node: '#drop-area-4-2',
        ariaLabel: 'drop area 2',
        data: 4,
        className: 'custom-class',
        //  accept: 'something'
      },
      {
        node: '#drop-area-4-3',
        ariaLabel: 'drop area 3',
        data: 1,
        className: 'custom-class'
      },
      {
        node: '#drop-area-4-4',
        ariaLabel: 'drop area 4',
        data: 5,
        className: 'custom-class'
      },
      {
        node: '#drop-area-4-5',
        ariaLabel: 'drop area 5',
        data: 3,
        className: 'custom-class'
      }
    ],
    onDragStart: function (e, item) {
      changeDropAreasKeyBoardDescDuringDrag(item, dnd.dropAreas);
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, params) {
      if (params.dragItem && params.dropArea) {
        params.dragItem.correct = params.dragItem.data === params.dropArea.data;

        if (params.dragItem.correct) {
          params.dragItem.addClass('correct-item');

          if (params.remainingDragItems[0]) {
            setLiveText(CORRECT_MESSAGE);

            setTimeout(function () {
              params.remainingDragItems[0].focus();
            }, VISUALLY_DELAY);
          } else {
            setLiveText(ALL_CORRECT_MESSAGE);
          }
        } else {
          params.dragItem.addClass('incorrect-item');
          setLiveText(INCORRECT_MESSAGE);

          setTimeout(function () {
            params.dragItem.reset();
            params.dragItem.removeClass('incorrect-item');
            params.dragItem.focus();
          }, VISUALLY_DELAY);
        }
      }
    },
    onCreate: function (dndObj) {
      console.log(dndObj);
    },
    onDragItemSelect: function (e, params) {
      params.allowedDropAreas[0].focus();
    },
    onDropAreaSelect: function (e, params) {
      if (params.currentDraggedItem) {
        params.currentDraggedItem.placeToDropArea({
          dropArea: params.dropArea,
          checkAfterAnimation: true
        });
      }
    }
  };

  var dnd = new CgDnd(settings);
})();