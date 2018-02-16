# cg-dnd

> JavaScript Accessible Drag And Drop Component by [Competentum Group](http://competentum.com/).
  Exported as a [UMD](https://github.com/umdjs/umd) module.

[![NPM][npm-image]][npm-url]

## Contents
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
    - [Static properties](#static-properties)
    - [Constructor](#constructor)
    - [Instance properties](#instance-properties)
    - [Instance methods](#instance-methods)
        - [on](#method_on)
        - [disable](#method_disable)
        - [reset](#method_reset)
        - [destroy](#method_destroy)

## Installation
Component can be installed with npm:
```
npm install --save cg-dnd
```

## Usage
Simple dnd example:

```javascript
import CgDnd from 'cg-dnd';

const settings = {
  dragItems: [{
    item: 'Text 1',
    ariaLabel: 'Text 1',
    data: 'item1'
  }],
  dropAreas: [{
    area: 'element',
    ariaLabel: 'Area 1'
  }],
  bounds: 'body',
  helper: 'original',
  handler: 'h2',
  enabled: true,
  snap: true,
  onCreate: function(data) {
    console.log('create drag', data);
  },
  onStart: function(data) {
    console.log('start drag', data);
  },
  onDrag: function(data) {
    console.log('drag', data);
  },
  onStop: function(data) {
    console.log('stop drag', data);
  }
};

const dnd = new CgDnd(settings);
```


## API

### Static properties
- `EVENTS` *{Object}* Events which dnd can emit.
    - `CREATE` - Emits on drag creating.
    - `START` - Emits on drag start.
    - `DRAG` - Emits on drag moving.
    - `STOP` - Emits on drag end.

See [dnd.on](#method_on) method to know how to use events.

<a name="constructor"></a>
### `new CgDnd(settings)` - constructor

- `settings` *{Object}* Set of configurable options to set on the dnd. Can have the following fields:
    - `bounds` *{string | Element}* Can be selector, element, `'parent'` or `'window'`. Default = `'null'`.
    - `helper` *{string}* Specifies what element will be used for dragging. Can be `'original'` or `'clone'`. Default = `'original'`.
    - `handler` *{string}* Specifies element where mousedown should occur to start dragging.
    - `disabled` *{boolean}* Drag is disabled if set to `true`. Default = `false`.
    - `snap` *{string}* If set to `true` items snap to drop areas. Default = `false`.
    - `dragItems` *{Array}* Array of drag items.
        - `item` *{string | Element}* Draggable element. Can be element or selector.
        - `ariaLabel` *{string}* Alternative text for item.
        - `data` *{string}* For checking correctness of drag.
        - `className` *{string}* Add class name to item.
    - `dropAreas` *{Object}* Array of drop areas.
        - `area` *{string | Element}* Drop area element. Can be element or selector.
        - `ariaLabel` *{string}* Alternative text for area.
        - `data` *{string}* For checking correctness of drag.
        - `className` *{string}* Add class name to area.
    - `onCreate` *{Function}* Triggers on drag creating.
    - `onStart` *{Function}* Triggers on drag start.
    - `onDrag` *{Function}* Triggers on drag moving.
    - `onStop` *{Function}* Triggers on drag end.

### Instance properties

To Be Described

### Instance methods
<a name="method_destroy"></a>
#### `.destroy()`

Remove all drag functionality.

<a name="method_disable"></a>
#### `.disable([disabled = true])`
- `disabled` *{boolean}* If set to `false` dragging is disabled. Default = `true`.

Disable\enable dnd.

<a name="method_reset"></a>
#### `.reset()`

Reset all items to default positions.

<a name="method_on"></a>
#### `.on(eventName, listener)`
- `eventName` *{string}* The name of the event.
- `listener` *{Function}* The callback function.

Adds the `listener` function to the end of the listeners array for the event named `eventName`. No checks are made to see if the listener has already been added. Multiple calls passing the same combination of eventName and listener will result in the listener being added, and called, multiple times.

```javascript
dnd.on(CgDnd.EVENTS.START, function (data) {
    console.log('Close Event with result', data);
});
```
Callback `data` argument is `to be described`.
> Current class extends Node.js EventEmitter. More information about working with events you can get [here](https://nodejs.org/api/events.html).


[npm-url]: https://www.npmjs.com/package/cg-dnd
[npm-image]: https://img.shields.io/npm/v/cg-dnd.svg?style=flat-square
