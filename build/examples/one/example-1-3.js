(function () {
  var exampleContainer = document.getElementById('third-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn'),
      disableSwitcher = exampleContainer.querySelector('#disable-switcher'),
      REPLACE_BY_CHOSEN_DRAG_ITEM_INSTRUCTION = 'Press space (double touch) to replace dropped in drag item by chosen drag item.',
      REPLACE_DROPPED_ITEM_INSTRUCTION = 'Press space (double touch) to select dropped item, that replace it',
      FILLED_DROP_AREA_KEYBOARD_DESC = 'Press space or double touch to replace dropped item by current dragged item or to select dropped item,'
                                       + ' if current dragged item doesn\'t exist';

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
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, params) {
      if (params.dragItem && params.dropArea) {
        params.dragItem.correct = params.dragItem.data === params.dropArea.data;

        params.dropArea.changeCurrentAriaState(function (params) {
          return 'Area was filled by ' + params.innerDragItems[0].getSetting('ariaLabel') + '. ';
        });
        params.dropArea.changeCurrentKeyboardDesc(function (params) {
          return FILLED_DROP_AREA_KEYBOARD_DESC;
        });

        if (params.previousDropArea) {
          console.log('reset')
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
        params.currentDraggedItem.putIntoDropArea(params.dropArea);
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

  disableSwitcher.addEventListener('change', function () {
    if (this.checked) {
      dnd.disable();
    } else {
      dnd.enable();
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