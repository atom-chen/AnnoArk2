import CvsMain from "./CvsMain";
import BaseUI from "./BaseUI";
import MainCtrl from "./MainCtrl";
import CityUI from "./CityUI";
import ArkInWorld from "./ArkInWorld";
import { DataMgr } from "./DataMgr";
import BlockchainMgr from "./BlockchainMgr";
import HomeUI from "./HomeUI";
import Island from "./World/Island";
import AttackIslandPanel from "./UI/AttackIslandPanel";
import DialogPanel from "./DialogPanel";
import CurrencyFormatter from "./Utils/CurrencyFormatter";
import SponsorIslandPanel from "./UI/SponsorIslandPanel";
import IslandInfoFrame from "./UI/IslandInfoFrame";
import ToastPanel from "./UI/ToastPanel";
import { SpecialArk } from "./World/SpecialArk";
import Pirate from "./World/Pirate";

const { ccclass, property } = cc._decorator;

@ccclass
export default class WorldUI extends BaseUI {
    static Instance: WorldUI;
    onLoad() {
        WorldUI.Instance = this;
        this.node.active = false;

        let self = this;
        this.sldZoom.node.getChildByName('Handle').on(cc.Node.EventType.TOUCH_START, function (event) {
            self.pressingZoomSlider = true;
        });
        this.sldZoom.node.getChildByName('Handle').on(cc.Node.EventType.TOUCH_END, function (event) {
            self.pressingZoomSlider = false;
        });
        this.sldZoom.node.getChildByName('Handle').on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
            self.pressingZoomSlider = false;
        });
        this.panPad.on(cc.Node.EventType.TOUCH_MOVE, this.onPanPadTouchMove, this);
        this.panPad.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        this.panPad.on(cc.Node.EventType.TOUCH_END, this.onPanPadTouchEnd, this);

        // cc.systemEvent.on(cc.SystemEvent.EventType.)

        this.initIslandInfoFrames();
    }

    @property(cc.Node)
    mineContainer: cc.Node = null;
    @property(cc.Node)
    islandContainer: cc.Node = null;

    @property(cc.Node)
    cityContainer: cc.Node = null;
    @property(cc.Node)
    cityTemplate: cc.Node = null;

    @property(cc.Node)
    pirateContainer: cc.Node = null;
    @property(cc.Node)
    pirateTemplate: cc.Node = null;

    @property(cc.Node)
    worldMap: cc.Node = null;
    @property(cc.Node)
    earth: cc.Node = null;

    @property(cc.Node)
    grpSelectObject: cc.Node = null;
    @property(cc.Node)
    grpSelectSpeArk: cc.Node = null;
    @property(cc.Node)
    selectFrame: cc.Node = null;
    @property(cc.Button)
    btnSponsorLink: cc.Button = null;
    @property(cc.Label)
    lblAttackButton: cc.Label = null;
    @property(cc.Button)
    btnCollectIsland: cc.Button = null;

    @property(cc.Node)
    panPad: cc.Node = null;
    @property(cc.Slider)
    sldZoom: cc.Slider = null;
    pressingZoomSlider = false;
    zoomScale: number = 0.1;

    refreshCountdown = 0;

    onEnable() {
        this.editSailDestinationMode = false;
        this.selectedObjectNode = null;

        if (!DataMgr.myUser) return;

        try {
            this.refreshData();
            this.refreshZoom();
        } catch (e) {
            console.error(e);
        }

        this.cityTemplate.active = false;
        this.pirateTemplate.active = false;
    }
    onBtnBackClick() {
        CvsMain.EnterUI(HomeUI);
    }

    refreshData() {
        //cities
        let neededCount = Object.keys(DataMgr.othersData).length + 1;
        for (let i = this.cityContainer.childrenCount; i < neededCount; i++) {
            let node = cc.instantiate(this.cityTemplate);
            node.parent = this.cityContainer;
            node.active = true;
        }
        let needToDestroys: cc.Node[] = [];
        for (let i = neededCount; i < this.cityContainer.childrenCount; i++) {
            needToDestroys.push(this.cityContainer.children[i]);
        }
        needToDestroys.forEach(c => c.destroy());

        let arkIW = this.cityContainer.children[0].getComponent(ArkInWorld);
        arkIW.setAndRefresh(DataMgr.myUser, this.zoomScale);
        let i = 0;
        for (let address in DataMgr.othersData) {
            const data = DataMgr.othersData[address];
            this.cityContainer.children[i + 1].getComponent(ArkInWorld).
                setAndRefresh(data, this.zoomScale);
            i++;
        }

        //Pirate
        neededCount = DataMgr.totalPirateCnt;
        for (let i = this.pirateContainer.childrenCount; i < neededCount; i++) {
            let node = cc.instantiate(this.pirateTemplate);
            node.parent = this.pirateContainer;
            node.active = true;
        }
        needToDestroys = [];
        for (let i = neededCount; i < this.pirateContainer.childrenCount; i++) {
            needToDestroys.push(this.pirateContainer.children[i]);
        }
        needToDestroys.forEach(c => c.destroy());
        for (let i = 0; i < neededCount; i++) {
            this.pirateContainer.children[i].getComponent(Pirate).setAndRefresh(i, DataMgr.getPirateInfo(i), DataMgr.pirateDatas[i], this.zoomScale);
        }

        this.refreshCountdown = 2;
    }

    refreshMyCity() {
        let arkIW = this.cityContainer.children[0].getComponent(ArkInWorld);
        arkIW.setAndRefresh(DataMgr.myUser, this.zoomScale);
    }

    refreshZoom() {
        // let size = 12000 * this.zoomScale;
        this.earth.scale = this.zoomScale;
        // this.arkContainer.children.forEach(c => {
        //     c.getComponent(ArkInWorld).refreshZoom(this.zoomScale);
        // })
        if (this.editSailDestinationMode && this.newDestination) {
            this.sailDestinationIndicator.position = this.newDestination.mul(this.zoomScale);
        }
    }

    update(dt: number) {

        if (this.refreshCountdown < 0) {
            try {
                this.refreshData();
            } catch (e) {
                console.error(e);
            }
        }
        this.refreshCountdown -= dt;

        let prog = this.sldZoom.progress;
        if (!this.pressingZoomSlider) {
            if (prog > 0.5) {
                prog -= 5 * dt;
                if (prog < 0.5) prog = 0.5;
                this.sldZoom.progress = prog;
            } else if (prog < 0.5) {
                prog += 5 * dt;
                if (prog > 0.5) prog = 0.5;
                this.sldZoom.progress = prog;
            }
        }
        if (prog != 0.5) {
            let oldZoomScale = this.zoomScale;
            this.zoomScale *= Math.pow(1.5, (prog - 0.5) * 2 * 5 * dt);
            this.clampZoom();
            let deltaZoom = this.zoomScale / oldZoomScale;
            this.worldMap.position = this.worldMap.position.mul(deltaZoom);
            this.refreshZoom();
        }

        //选中对象模式
        if (this.selectedObjectNode) {
            this.selectFrame.active = true;
            this.selectFrame.position = this.selectedObjectNode.position;
            this.selectFrame.setContentSize(this.selectedObjectNode.width * 2, this.selectedObjectNode.height * 2);
            let arkIW = this.selectedObjectNode.getComponent(ArkInWorld);
            let speArk = this.selectedObjectNode.getComponent(SpecialArk);
            let island = this.selectedObjectNode.getComponent(Island);
            if (arkIW) {
                this.grpSelectSpeArk.active = false;
                this.grpSelectObject.active = false;
            } else if (island) {
                this.btnSponsorLink.getComponentInChildren(cc.Label).string =
                    island.data.sponsorName ? island.data.sponsorName : '无赞助商';
                if (island.data.occupant && island.data.occupant == DataMgr.myUser.address) {
                    this.lblAttackButton.string = '追加\n驻军';
                    const t0 = island.data.lastMineTime;
                    const t1 = Number(new Date());
                    const t = (t1 - t0) / (1000 * 3600);//h
                    const r = island.data.miningRate;
                    const m = island.data.money * (1 - Math.exp(-r * t)) / 1e18;
                    this.btnCollectIsland.node.active = true;
                    this.btnCollectIsland.getComponentInChildren(cc.Label).string = '收取\n' + CurrencyFormatter.formatNAS(m) + 'NAS';
                } else {
                    this.lblAttackButton.string = '攻占';
                    this.btnCollectIsland.node.active = false;
                }
                this.grpSelectSpeArk.active = false;
                this.grpSelectObject.active = true;
            } else if (speArk) {
                this.grpSelectObject.active = false;
                this.grpSelectSpeArk.active = true;
            }
        } else {
            this.grpSelectSpeArk.active = false;
            this.selectFrame.active = false;
            this.grpSelectObject.active = false;
        }

        //选择目的地模式
        if (this.editSailDestinationMode) {
            this.grpSail.active = true;
            this.sailDestinationIndicator.active = this.newDestination != null;
            if (this.newDestination) {
                let pos = new cc.Vec2(DataMgr.myUser.currentLocation.x, DataMgr.myUser.currentLocation.y);
                let distance = this.newDestination.sub(pos).mag();
                let time = distance / DataMgr.getArkSpeedByTech(DataMgr.myTechData.find(d => d.id == 'arkspeed1011').finished);
                let methane = DataMgr.MethaneCostPerKmPerSize * distance * DataMgr.myUser.arkSize;
                let str = `${distance.toFixed()}km\n${time.toFixed()}min\n${methane.toFixed()}甲烷`;
                this.lblDestinationInfo.string = str;
            }
        } else {
            this.grpSail.active = false;
            this.sailDestinationIndicator.active = false;
        }
    }

    onGotoArkClick() {
        CvsMain.EnterUI(CityUI);
    }

    onCenterBtnClick() {
        let data = DataMgr.myUser;
        let rawPos = data.currentLocation;
        rawPos.mulSelf(this.zoomScale);
        this.worldMap.position = rawPos.neg();
    }

    onPanPadTouchMove(event: cc.Event.EventTouch) {
        let delta = event.getDelta();
        this.worldMap.position = this.worldMap.position.add(new cc.Vec2(delta.x, delta.y));
    }
    onPanPadTouchEnd(event: cc.Event.EventTouch) {
        if (this.editSailDestinationMode) {
            let curLoc = event.getLocation();
            let displacement = new cc.Vec2(curLoc.x, curLoc.y).sub(event.getStartLocation());
            if (displacement.mag() < 20) {
                let touchPos = this.worldMap.convertTouchToNodeSpaceAR(event.touch);
                this.newDestination = touchPos.mul(1 / this.zoomScale);
                this.sailDestinationIndicator.position = this.newDestination.mul(this.zoomScale);
            }
        }
        if (this.selectedObjectNode) {
            let curLoc = event.getLocation();
            let displacement = new cc.Vec2(curLoc.x, curLoc.y).sub(event.getStartLocation());
            if (displacement.mag() < 20) {
                this.cancelSelectObject();
            }
        }
    }
    onMouseWheel(event: cc.Event.EventMouse) {
        let delta = event.getScrollY();
        let oldZoomScale = this.zoomScale;
        this.zoomScale *= Math.pow(1.5, (delta / 120)); //delta每次±120
        this.clampZoom();
        let deltaZoom = this.zoomScale / oldZoomScale;
        this.worldMap.position = this.worldMap.position.mul(deltaZoom);
        this.refreshZoom();
    }
    onZoomSliderChange(slider: cc.Slider) {
        // console.log('sld', slider.progress);
    }
    clampZoom() {
        if (this.zoomScale > 10) this.zoomScale = 10;
        if (this.zoomScale < 0.01) this.zoomScale = 0.01;
    }

    //选中
    @property(cc.Label)
    lblAsideSelectFrame: cc.Label = null;
    selectedObjectNode: cc.Node;
    selectArk(arkNode: cc.Node) {
        if (this.editSailDestinationMode) return;
        this.selectedObjectNode = arkNode;
    }
    selectSpecialArk(arkNode: cc.Node) {
        if (this.editSailDestinationMode) return;
        this.selectedObjectNode = arkNode;
    }
    selectIsland(islandNode: cc.Node) {
        if (this.editSailDestinationMode) return;
        this.selectedObjectNode = islandNode;
    }
    cancelSelectObject() {
        this.selectedObjectNode = null;
    }
    onSelectObjectInfoClick() {
        let speArk = this.selectedObjectNode.getComponent(SpecialArk);
        if (speArk) {
            let pos = new cc.Vec2(DataMgr.myUser.currentLocation.x, DataMgr.myUser.currentLocation.y);
            let dist = pos.sub(speArk.location).mag();
            speArk.showInfo(dist);
        }
    }
    onBtnAttackIslandClick() {
        const island = this.selectedObjectNode ? this.selectedObjectNode.getComponent(Island) : null;
        if (!island) return;
        CvsMain.OpenPanel(AttackIslandPanel);
        AttackIslandPanel.Instance.setAndRefresh(island);
    }
    onBtnCollectIslandClick() { //收获
        const island = this.selectedObjectNode ? this.selectedObjectNode.getComponent(Island) : null;
        if (!island) return;
        if (island.data.occupant == DataMgr.myUser.address) {
            BlockchainMgr.Instance.collectIslandMoney(island.data.id);
        }
    }
    onIslandSponsorLinkClick() {
        const island = this.selectedObjectNode ? this.selectedObjectNode.getComponent(Island) : null;
        if (island && island.data.sponsorLink) {
            window.open(island.data.sponsorLink);
        }
    }
    onIslandIWantSponsorClick() {
        const island = this.selectedObjectNode ? this.selectedObjectNode.getComponent(Island) : null;
        if (island) {
            CvsMain.OpenPanel(SponsorIslandPanel);
            SponsorIslandPanel.Instance.setData(island);
        }
    }

    //航行
    editSailDestinationMode = false;
    newDestination: cc.Vec2;
    @property(cc.Node)
    grpSail: cc.Node = null;
    @property(cc.Node)
    sailDestinationIndicator: cc.Node = null;
    @property(cc.Label)
    lblDestinationInfo: cc.Label = null;
    @property(cc.Node)
    btnCancelSail: cc.Node = null;
    @property(cc.Node)
    btnConfirmSail: cc.Node = null;

    onBtnSailClick() {
        this.selectedObjectNode = null;
        this.editSailDestinationMode = true;
        this.newDestination = null;
        const arkSpeedTechData = DataMgr.myTechData.find(d => d.id == 'arkspeed1011');
        const myData = DataMgr.myUser;
        myData.speed = DataMgr.getArkSpeedByTech(arkSpeedTechData ? arkSpeedTechData.finished : false);
    }
    onCancelSailClick() {
        this.editSailDestinationMode = false;
        this.newDestination = null;
    }
    onConfirmSailClick() {
        if (!this.newDestination) {
            ToastPanel.Toast('请先点击地图空白位置，选择目的地，再点√');
            return;
        }
        const myData = DataMgr.myUser;
        if (myData.arkSize <= DataMgr.SmallArkSize) {
            DialogPanel.PopupWith1Button('简陋方舟无法航行', '您的方舟是简陋方舟，没有扩建功能，请原地呆着吧。\n想要功能完整的方舟？请回到主界面领取标准方舟或大型方舟。需要安装星云钱包哦！', '知道了', null);
            return;
        }
        let pos = new cc.Vec2(DataMgr.myUser.currentLocation.x, DataMgr.myUser.currentLocation.y);
        let distance = this.newDestination.sub(pos).mag();
        let needMethane = DataMgr.MethaneCostPerKmPerSize * distance * DataMgr.myUser.arkSize;
        let methaneData = DataMgr.myCargoData.find(d => d.id == 'methane74');
        if (needMethane > methaneData.amount) {
            DialogPanel.PopupWith1Button('燃料不足', '方舟引擎的唯一动力来源是甲烷。如果你想要环球旅行，多造一些[甲烷采集器]吧！', '知道了', null);
            return;
        }

        const arkSpeedTechData = DataMgr.myTechData.find(d => d.id == 'arkspeed1011');
        myData.speed = DataMgr.getArkSpeedByTech(arkSpeedTechData ? arkSpeedTechData.finished : false);
        let deltaData = {};
        deltaData['nickname'] = myData.nickname;
        deltaData['country'] = myData.country;
        deltaData['arkSize'] = myData.arkSize;
        deltaData['population'] = myData.population;
        deltaData['speed'] = myData.speed;
        deltaData['locationX'] = myData.currentLocation.x;
        deltaData['locationY'] = myData.currentLocation.y;
        deltaData['destinationX'] = this.newDestination.x;
        deltaData['destinationY'] = this.newDestination.y;

        console.log('ConfirmSail', deltaData);
        BlockchainMgr.Instance.setSail(deltaData, () => {
            methaneData.amount = Math.max(0, methaneData.amount - needMethane);
        });
    }


    //岛屿初始化
    @property(cc.Node)
    islandInfoFrameTemplate: cc.Node = null;
    initIslandInfoFrames() {
        this.islandContainer.children.forEach(islandNode => {
            let frm = cc.instantiate(this.islandInfoFrameTemplate);
            frm.parent = islandNode;
            frm.position = this.islandInfoFrameTemplate.position;
            islandNode.getComponent(Island).infoFrame = frm.getComponent(IslandInfoFrame);
            frm.active = true;
        });
        this.islandInfoFrameTemplate.active = false;
    }
}
