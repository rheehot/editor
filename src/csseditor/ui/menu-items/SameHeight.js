import MenuItem from "./MenuItem";
import Sort from "../../../editor/Sort";
import icon from "../icon/icon";
   
export default class SameHeight extends MenuItem {
  getIconString() {
    return icon.same_height;
  }
  getTitle() {
    return "height";
  }

  isHideTitle () {
    return true; 
  }
  clickButton(e) {
    this.emit('same.height');
  }
}
