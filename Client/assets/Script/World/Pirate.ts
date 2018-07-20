import WorldUI from "../WorldUI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Pirate extends cc.Component {

    @property(cc.Label)
    lblName: cc.Label = null;
    @property(cc.Label)
    lblLv: cc.Label = null;
    @property(cc.Node)
    grpInfo: cc.Node = null;

    index: number;
    info;
    data;

    setAndRefresh(index, info, data, zoomScale: number) {
        this.index = index;
        this.info = info;
        this.data = data;
        // this.sprArk.node.setContentSize(data.arkSize, data.arkSize);
        this.lblName.string = '海盗';
        this.lblLv.string = (info.lv + 1).toString();
        this.refreshZoom(zoomScale);
    }

    refreshZoom(zoomScale: number) {
        let curLoc = new cc.Vec2(this.info.x, this.info.y);
        this.node.position = curLoc.mul(zoomScale);
    }

    update(dt: number) {
        this.refreshZoom(WorldUI.Instance.zoomScale);
    }

    onClick() {
        WorldUI.Instance.selectArk(this.node);
    }
}
