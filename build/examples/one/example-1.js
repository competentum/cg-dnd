(function () {
  var exampleContainer = document.getElementById('first-example'),
      checkButton = exampleContainer.querySelector('.check-btn'),
      resetButton = exampleContainer.querySelector('.reset-btn');

  var settings = {
    bounds: '#first-example',
    //bounds: [0, 0, 800, 600],
    alignRemainingDragItems: true,
    container: '#first-example',
    commonDragItemsSettings: {
      handler: '.handler',
      initAriaKeyboardAccessDesc: 'Press UP/DOWN buttons to choose drag item, then press space button to select it'
    },
    commonDropAreasSettings: {
      initAriaKeyboardAccessDesc: 'Press UP/DOWN buttons to choose drop area, then press space button to select it'
    },
    tooltipParams: {
      html: 'custom tooltip',
      className: 'custom-tooltip',
    },
    dragItems: [
      {
        node: '#drag-item-1',
        data: 1,
        ariaLabel: 'drag item 1',
        className: 'custom-class',
        groups: ['www', 'something']
      },
      {
        node: '#drag-item-2',
        data: 2,
        ariaLabel: 'drag item 2',
        className: 'custom-class',
        groups: 'something'
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
        className: 'custom-drop-area-class',
        //  accept: 'something'
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
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, params) {
      if (params.dragItem && params.dropArea && params.dragItem.data === params.dropArea.data) {
        params.dragItem.correct = true;
      }

      if (params.dropArea) {
        params.dropArea.changeCurrentKeyboardDesc(function (area) {
          return 'press keys';
        });
        params.dropArea.changeCurrentAriaState(function (params) {
          if (params.innerDragItemsCount) {
            return 'drop area was filled by ' + params.innerDragItems[0].getSetting('ariaLabel');
          }
        });
      }

     // setTimeout(function () {
        if (params.remainingDragItems[0]) {
          params.remainingDragItems[0].focus();
        } else {
          checkButton.focus();
        }
   //   }, 0);
    },
    onCreate: function (dndObj) {
      console.log(dndObj);
    },
    onDragItemSelect: function (e, params) {
   //   setTimeout(function () {
        params.dropAreas[0].focus();
   //   }, 0);
    },
    onDropAreaSelect: function (e, params) {
      if (params.currentDraggedItem) {
        params.currentDraggedItem.putIntoDropArea(params.dropArea, true);


      }
    }
  };

  var dnd = new CgDnd(settings);

  checkButton.addEventListener('click', function () {
    dnd.resetIncorrectItems();
    dnd.dragItems.forEach(function (item) {
      if (item.correct) {
        item.addClass('correct-item');
      }
    })
  });

  resetButton.addEventListener('click', function () {
    dnd.reset({ removedClassName: 'correct-item' });
  });
})();