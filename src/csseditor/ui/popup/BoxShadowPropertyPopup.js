import { EVENT } from "../../../util/UIElement";
import { Length } from "../../../editor/unit/Length";
import { LOAD, CLICK, POINTERSTART, MOVE } from "../../../util/Event";
import RangeEditor from "../property-editor/RangeEditor";
import BasePopup from "./BasePopup";
import EmbedColorPicker from "../property-editor/EmbedColorPicker";


export default class BoxShadowPropertyPopup extends BasePopup {

  getTitle() {
    return 'Box Shadow Editor'
  }

  components() {
    return {
      EmbedColorPicker,
      RangeEditor
    }
  }
  initState() {
    return {
      color: 'rgba(0, 0, 0, 1)',
      inset: false,
      offsetX: Length.px(0),
      offsetY: Length.px(0),
      blurRadius: Length.px(0),
      spreadRadius: Length.px(0)
    };
  }

  updateData(opt) {
    this.setState(opt, false); 
    this.emit(this.changeEvent, opt, this.state.params);
  }

  getBody() {
    return /*html*/`<div class='box-shadow-property-popup' ref='$popup'></div>`;
  }

  [LOAD("$popup")]() {
    return /*html*/`
      <div class='box'>
        <EmbedColorPicker ref='$colorpicker' value='${this.state.color}' onchange='changeColor' />
      </div>
      <div class="box">
        <div class="type">
          <label>Type</label>
          <div
            class="select"
            data-selected-value="${this.state.inset ? "inset" : "outset"}"
            ref="$type"
          >
            <button type="button" data-value="outset">Outset</button>
            <button type="button" data-value="inset">Inset</button>
          </div>
        </div>
        <div class="drag-board" ref="$dragBoard">
          <div
            class="pointer"
            ref="$pointer"
            style="left: ${this.state.offsetX};top: ${this.state.offsetY}"
          ></div>
        </div>        
        <div class="offset-x">
          <RangeEditor ref='$offsetX' label='X' key='offsetX' value="${this.state.offsetX}" onchange='changeRangeEditor' />
        </div>
        <div class="offset-y">
          <RangeEditor ref='$offsetY' label='Y' key='offsetY' value="${this.state.offsetY}" onchange='changeRangeEditor' />        
        </div>
        <div class="blur-radius">
          <RangeEditor ref='$blurRadius' label='Blur' key='blurRadius' value="${this.state.blurRadius}" onchange='changeRangeEditor' />        
        </div>
        <div class="spread-radius">
          <RangeEditor ref='$spreadRadius' label='Spread' key='spreadRadius' value="${this.state.spreadRadius}" onchange='changeRangeEditor' />        
        </div>

      </div>
    `;
  }


  [CLICK("$popup .select button")](e) {
    var type = e.$dt.attr("data-value");

    this.getRef("$type").attr("data-selected-value", type);

    this.updateData({
      inset: type === "inset"
    });
  }

  [POINTERSTART("$popup .drag-board") + MOVE("movePointer")](e) {
    this.offsetX = e.offsetX;
    this.offsetY = e.offsetY;

    var rect = this.getRef("$dragBoard").rect();
    this.boardWidth = rect.width;
    this.boardHeight = rect.height;
  }

  refreshPointer() {
    this.getRef("$pointer").css({
      left: this.state.offsetX,
      top: this.state.offsetY
    });

  }

  movePointer(dx, dy) {
    var realX = this.offsetX + dx;
    var realY = this.offsetY + dy;

    var halfWidth = this.boardWidth / 2;
    var halfHeight = this.boardHeight / 2;

    var x = realX - halfWidth;
    var y = realY - halfHeight;

    if (x < -halfWidth) {
      x = -halfWidth;
    } else if (x > halfWidth) {
      x = halfWidth;
    }

    if (y < -halfHeight) {
      y = -halfHeight;
    } else if (y > halfHeight) {
      y = halfHeight;
    }

    x = Math.floor(x);
    y = Math.floor(y);

    this.getRef("$offsetX").val(x);
    this.getRef("$offsetY").val(y);

    this.updateData({
      offsetX: Length.px(x),
      offsetY: Length.px(y)
    });

    this.refreshPointer();

    this.children.$offsetX.setValue(this.state.offsetX)
    this.children.$offsetY.setValue(this.state.offsetY)    
  }

  [EVENT('changeRangeEditor')] (key, value) {
    this.updateData({
      [key]: value
    })

    if (key === 'offsetX' || key === 'offsetY') {
      this.refreshPointer()
    }
  }

  [EVENT('changeColor')] (value) {
    this.trigger('changeRangeEditor', 'color', value);
  }

  [EVENT("showBoxShadowPropertyPopup")](data, params) {

    this.changeEvent = data.changeEvent || "changeBoxShadowPropertyPopup"

    this.setState({...data, params});
    this.refresh();

    this.show(432);

  }

  [EVENT( "hideBoxShadowPropertyPopup" )]() {
    this.hide();
  }
}
