(function () {
  var settings = {
    bounds: '#fourth-example',
    alignRemainingDragItems: true,
    forbidFocusOnFilledDropAreas: true,
    container: '#fourth-example',
    dragItems: [
      {
        node: '#drag-item-4-1',
        data: 1,
        ariaLabel: '',
        className: 'custom-class',
        groups: ['www', 'something']
      },
      {
        node: '#drag-item-4-2',
        data: 2,
        ariaLabel: '',
        className: 'custom-class',
        groups: 'something'
      },
      {
        node: '#drag-item-4-3',
        data: 3,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-4-4',
        data: 4,
        ariaLabel: '',
        className: 'custom-class'
      },
      {
        node: '#drag-item-4-5',
        data: 5,
        ariaLabel: '',
        className: 'custom-class'
      }
    ],
    dropAreas: [
      {
        node: '#drop-area-4-1',
        ariaLabel: '',
        data: 2,
        className: 'custom-class'
      },
      {
        node: '#drop-area-4-2',
        ariaLabel: '',
        data: 4,
        className: 'custom-class',
        //  accept: 'something'
      },
      {
        node: '#drop-area-4-3',
        ariaLabel: '',
        data: 1,
        className: 'custom-class'
      },
      {
        node: '#drop-area-4-4',
        ariaLabel: '',
        data: 5,
        className: 'custom-class'
      },
      {
        node: '#drop-area-4-5',
        ariaLabel: '',
        data: 3,
        className: 'custom-class'
      }
    ],
    onDragStart: function (e, item) {
    },
    onDragMove: function (e, item) {
    },
    onDragStop: function (e, params) {
      var visuallyDelay = null;

      if (params.dragItem && params.dropArea) {
        params.dragItem.correct = params.dragItem.data === params.dropArea.data;

        if (params.dragItem.correct) {
          params.dragItem.addClass('correct-item');
          if (params.remainingDragItems[0]) {
            params.remainingDragItems[0].focus(visuallyDelay);
          }
        } else {
          params.dragItem.addClass('incorrect-item');
          visuallyDelay = 500;

          setTimeout(function () {
            params.dragItem.reset();
            params.dragItem.removeClass('incorrect-item');
            params.remainingDragItems[0].focus(visuallyDelay);
          }, visuallyDelay);
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
        params.currentDraggedItem.putIntoDropArea(params.dropArea, true);
      }
    }
  };

  var dnd = new CgDnd(settings);
})();