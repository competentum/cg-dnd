(function () {
  var exampleContainer = document.getElementById('third-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn'),
      disableSwitcher = exampleContainer.querySelector('#disable-switcher');

  var settings = {
    disabled: true,
    disabledClassName: 'disabled',
    bounds: '#third-example',
    alignRemainingDragItems: true,
    possibleToReplaceDroppedItem: true,
    container: '#third-example',
    commonDropAreasSettings: {
      maxItemsInDropArea: 1,
      snapAlignParams: {
        horizontalAlign: 'center',
        verticalAlign: 'center'
      }
    },
    tooltipParams: {
      html: 'custom tooltip',
      className: 'custom-tooltip',
    },
    dragItems: [
      {
        node: '#drag-item-3-1',
        data: 1,
        ariaLabel: '',
        className: 'custom-class',
        groups: ['www', 'something']
      },
      {
        node: '#drag-item-3-2',
        data: 2,
        ariaLabel: '',
        className: 'custom-class',
        groups: 'something'
      },
      {
        node: '#drag-item-3-3',
        data: 3,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-3-4',
        data: 4,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-3-5',
        data: 5,
        ariaLabel: '',
        className: 'custom-class'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-3-1',
        ariaLabel: '',
        data: 2,
        className: 'transparent-drop-area'
      },
      {
        node: '#drop-area-3-2',
        ariaLabel: '',
        data: 4,
        className: 'transparent-drop-area',
        //  accept: 'something'
      },
      {
        node: '#drop-area-3-3',
        ariaLabel: '',
        data: 1,
        className: 'transparent-drop-area'
      },
      {
        node: '#drop-area-3-4',
        ariaLabel: '',
        data: 5,
        className: 'transparent-drop-area'
      },
      {
        node: '#drop-area-3-5',
        ariaLabel: '',
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
  })
})();