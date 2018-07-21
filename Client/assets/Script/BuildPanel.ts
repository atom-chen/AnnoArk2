import { DataMgr, IJ } from "./DataMgr";
import BuildingButton from "./BuildingButton";
import CityUI from "./CityUI";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BuildPanel extends cc.Component {
    static Instance: BuildPanel;
    onLoad() { BuildPanel.Instance = this; }

    @property(cc.Node)
    buttonContainer: cc.Node = null;
    @property(cc.Node)
    buttonTemplate: cc.Node = null;

    start() {
        DataMgr.BuildingConfig.forEach(building => {
            let buildingBtnNode = cc.instantiate(this.buttonTemplate);
            buildingBtnNode.parent = this.buttonContainer;
            let buildingBtn = buildingBtnNode.getComponent(BuildingButton);
            buildingBtn.setAndRefresh(building);
            buildingBtnNode.active = true;
        });
        this.buttonTemplate.active = false;
    }

    onEnable () {
        
    }

    refresh() {

    }

    onBtnExpandClick() {
        CityUI.Instance.currentHoldingBlueprint = 'expand';
        CityUI.Instance.currentBlueprintIJ = IJ.ZERO;
        this.close();
    }

    close() {
        this.node.destroy();
        BuildPanel.Instance = null;
    }
}