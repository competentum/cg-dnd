(function () {
  var exampleContainer = document.getElementById('second-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn');

  var settings = {
    bounds: '#second-example',
    maxItemsInDropArea: 1,
    forbidFocusOnFilledDropAreas: true,
    animationParams: {
      duration: 2000
    },
    dragItems: [
      {
        node: '#drag-item-2-1',
        data: 1,
        ariaLabel: '',
        className: 'custom-class',
        groups: ['www', 'something']
      },
      {
        node: '#drag-item-2-2',
        data: 2,
        ariaLabel: '',
        className: 'custom-class',
        groups: 'something'
      },
      {
        node: '#drag-item-2-3',
        data: 3,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-2-4',
        data: 4,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-2-5',
        data: 5,
        ariaLabel: '',
        className: 'custom-class'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-2-1',
        ariaLabel: '',
        data: 2,
        className: 'custom-drop-area-class'
      },
      {
        node: '#drop-area-2-2',
        ariaLabel: '',
        data: 4,
        className: 'custom-drop-area-class',
        //  accept: 'something'
      },
      {
        node: '#drop-area-2-3',
        ariaLabel: '',
        data: 1,
        className: 'custom-drop-area-class'
      },
      {
        node: '#drop-area-2-4',
        ariaLabel: '',
        data: 5,
        className: 'custom-drop-area-class'
      },
      {
        node: '#drop-area-2-5',
        ariaLabel: '',
        data: 3,
        className: 'custom-drop-area-class'
      }
    ],
    onDragStart: function (e, item) {
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, params) {
      if (params.dragItem && params.dropArea && params.dragItem.data === params.dropArea.data) {
        params.dragItem.correct = true;
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
        params.currentDraggedItem.putIntoDropArea(params.dropArea);

        if (params.remainingDragItems[0]) {
          params.remainingDragItems[0].focus();
        } else {
          checkButton.focus();
        }
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
})();