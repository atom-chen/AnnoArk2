import CvsMain from "./CvsMain";
import BaseUI from "./BaseUI";
import CityUI from "./CityUI";
import { DataMgr } from "./DataMgr";
import BlockchainMgr from "./BlockchainMgr";
import HomeUI from "./HomeUI";
import Island from "./World/Island";
import AttackIslandPanel from "./UI/AttackIslandPanel";
import CurrencyFormatter from "./Utils/CurrencyFormatter";
import SponsorIslandPanel from "./UI/SponsorIslandPanel";
import IslandInfoFrame from "./UI/IslandInfoFrame";
import ToastPanel from "./UI/ToastPanel";
import { SpecialArk } from "./World/SpecialArk";
import Pirate from "./World/Pirate";
import WatchPiratePanel from "./UI/WatchPiratePanel";
import AttackPiratePanel from "./UI/AttackPiratePanel";
import ArkInWorld from "./World/ArkInWorld";
import DialogPanel from "./UI/DialogPanel";
import AttackOtherPanel from "./UI/AttackOtherPanel";
import WatchOtherPanel from "./UI/WatchOtherPanel";

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
    grpSelectOther: cc.Node = null;
    @property(cc.Node)
    grpSelectIsland: cc.Node = null;
    @property(cc.Node)
    grpSelectPirate: cc.Node = null;
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

    @property(cc.Toggle)
    togOtherPlayer: cc.Toggle = null;
    @property(cc.Toggle)
    togPirate: cc.Toggle = null;
    @property(cc.Toggle)
    togDiamond: cc.Toggle = null;
    @property(cc.Toggle)
    togScenicSpot: cc.Toggle = null;
    @property(cc.Toggle)
    togNuke: cc.Toggle = null;

    @property(cc.Node)
    focusedInfoFrame: cc.Node = null;
    @property(cc.Label)
    lblSelectInfo0: cc.Label = null;
    @property(cc.RichText)
    lblSelectInfo1: cc.RichText = null;

    refreshCountdown = 0;

    onEnable() {
        this.editSailDestinationMode = false;
        this.focusedObjectNode = null;

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
        // if (this.togOtherPlayer.isChecked) {
        let neededCount = Object.keys(DataMgr.allUsers).length;
        for (let i = this.cityContainer.childrenCount; i < neededCount; i++) {
            let node = cc.instantiate(this.cityTemplate);
            node.parent = this.cityContainer;
            node.active = true;
            node.on(cc.Node.EventType.TOUCH_MOVE, this.onPanPadTouchMove, this);
            node.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        }
        let needToDestroys: cc.Node[] = [];
        for (let i = neededCount; i < this.cityContainer.childrenCount; i++) {
            needToDestroys.push(this.cityContainer.children[i]);
        }
        needToDestroys.forEach(c => c.destroy());

        let i = 0;
        for (let address in DataMgr.allUsers) {
            const data = DataMgr.allUsers[address];
            this.cityContainer.children[i].getComponent(ArkInWorld).setAndRefresh(data, this.zoomScale);
            i++;
        }

        //pirate
        if (this.togPirate.isChecked) {
            neededCount = DataMgr.totalPirateCnt;
            for (let i = this.pirateContainer.childrenCount; i < neededCount; i++) {
                let node = cc.instantiate(this.pirateTemplate);
                node.parent = this.pirateContainer;
                node.active = true;
                node.on(cc.Node.EventType.TOUCH_MOVE, this.onPanPadTouchMove, this);
                node.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
            }
            needToDestroys = [];
            for (let i = neededCount; i < this.pirateContainer.childrenCount; i++) {
                needToDestroys.push(this.pirateContainer.children[i]);
            }
            needToDestroys.forEach(c => c.destroy());
            for (let i = 0; i < neededCount; i++) {
                this.pirateContainer.children[i].getComponent(Pirate).setAndRefresh(i, DataMgr.getPirateData(i), this.zoomScale);
            }
            this.pirateContainer.active = true;
        } else {
            this.pirateContainer.active = false;
        }

        this.refreshCountdown = 2;
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

        this.focusedInfoFrame.active = false;

        //选中对象模式
        if (this.focusedObjectNode) {
            this.selectFrame.active = true;
            this.selectFrame.position = this.focusedObjectNode.position;
            // this.selectFrame.setContentSize(this.focusedObjectNode.width, this.focusedObjectNode.height);
            let arkIW = this.focusedObjectNode.getComponent(ArkInWorld);
            let speArk = this.focusedObjectNode.getComponent(SpecialArk);
            let pirate = this.focusedObjectNode.getComponent(Pirate);
            let island = this.focusedObjectNode.getComponent(Island);
            if (arkIW) {
                this.grpSelectSpeArk.active = false;
                this.grpSelectIsland.active = false;
            } else if (pirate) {
                this.grpSelectSpeArk.active = false;
                this.grpSelectIsland.active = false;
                this.focusedInfoFrame.active = true;

                this.focusedInfoFrame.position = this.focusedObjectNode.position;
                this.lblSelectInfo0.string = `Lv ${pirate.data.lv + 1}`;
                this.lblSelectInfo1.string =
                    `坦克 ${pirate.data.army.tank ? pirate.data.army.tank.toFixed() : 0}
无人机 ${pirate.data.army.tank ? pirate.data.army.tank.toFixed() : 0}
炮舰 ${pirate.data.army.tank ? pirate.data.army.tank.toFixed() : 0}
浮力模块 ${pirate.data.cargo.floatmod ? pirate.data.cargo.floatmod.toFixed() : 0}`;
            } else if (island) {
                this.btnSponsorLink.getComponentInChildren(cc.Label).string =
                    island.data.sponsorName ? island.data.sponsorName : '无赞助商';
                if (island.data.occupant && DataMgr.myUser && island.data.occupant == DataMgr.myUser.address) {
                    this.lblAttackButton.string = '追加\n驻军';
                    const t0 = island.data.lastMineTime;
                    const t1 = Number(new Date());
                    const t = (t1 - t0) / (1000 * 3600);//h
                    const r = island.data.miningRate;
                    const m = island.data.money * (1 - Math.exp(-r * t)) / 1e18;
                    this.btnCollectIsland.node.active = true;
                    this.btnCollectIsland.getComponentInChildren(cc.Label).string = '收取\n' + CurrencyFormatter.formatNAS(m) + DataMgr.coinUnit;
                } else {
                    this.lblAttackButton.string = '攻占';
                    this.btnCollectIsland.node.active = false;
                }
                this.grpSelectSpeArk.active = false;
                this.grpSelectIsland.active = true;
            } else if (speArk) {
                this.grpSelectIsland.active = false;
                this.grpSelectSpeArk.active = true;
            }
            this.grpSelectPirate.active = pirate && true;
            this.grpSelectOther.active = arkIW && arkIW.data.address !== DataMgr.myUser.address;
        } else {
            this.grpSelectSpeArk.active = false;
            this.selectFrame.active = false;
            this.grpSelectIsland.active = false;
            this.grpSelectPirate.active = false;
            this.grpSelectOther.active = false;
        }

        //选择目的地模式
        if (this.editSailDestinationMode) {
            this.grpSail.active = true;
            this.sailDestinationIndicator.active = this.newDestination != null;
            this.focusedInfoFrame.active = this.newDestination != null;
            if (this.newDestination) {
                let pos = DataMgr.getUserCurrentLocation(DataMgr.myUser);
                let distance = this.newDestination.sub(pos).mag();
                let time = distance / DataMgr.cityMoveSpeed;
                let ch4 = DataMgr.getSailEnergyCost(DataMgr.myUser, distance);
                this.lblSelectInfo0.string = `${distance.toFixed()}km`;
                this.lblSelectInfo1.string = `${time.toFixed()}min\n${ch4.toFixed()}甲烷`;
            }
        } else {
            this.grpSail.active = false;
            this.sailDestinationIndicator.active = false;
        }
    }

    onGotoArkClick() {
        if (!DataMgr.myUser) {
            ToastPanel.Toast('您尚未领取方舟');
            return;
        }
        CvsMain.EnterUI(CityUI);
    }

    onCenterBtnClick() {
        if (!DataMgr.myUser) {
            return;
        }
        let user = DataMgr.myUser;
        let rawPos = DataMgr.getUserCurrentLocation(user);
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
                this.focusedInfoFrame.position = this.newDestination.mul(this.zoomScale);
            }
        }
        if (this.focusedObjectNode) {
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
    focusedObjectNode: cc.Node;
    selectObject(node: cc.Node) {
        if (this.editSailDestinationMode) {
            this.newDestination = node.position.mul(1 / this.zoomScale);
            this.sailDestinationIndicator.position = this.newDestination.mul(this.zoomScale);
            this.focusedInfoFrame.position = this.newDestination.mul(this.zoomScale);
        } else {
            this.focusedObjectNode = node;
        }
    }
    cancelSelectObject() {
        this.focusedObjectNode = null;
    }
    onSelectObjectInfoClick() {
        let speArk = this.focusedObjectNode.getComponent(SpecialArk);
        if (speArk) {
            let dist: number
            if (DataMgr.myUser) {
                let pos = DataMgr.getUserCurrentLocation(DataMgr.myUser);
                dist = pos.sub(speArk.location).mag();
            } else {
                dist = 6e3;
            }
            speArk.showInfo(dist);
        }
    }
    onBtnAttackIslandClick() {
        if (!DataMgr.myUser) {
            ToastPanel.Toast('拥有方舟才能进攻');
            return;
        }
        const island = this.focusedObjectNode ? this.focusedObjectNode.getComponent(Island) : null;
        if (!island) return;
        CvsMain.OpenPanel(AttackIslandPanel);
        AttackIslandPanel.Instance.setAndRefresh(island);
    }
    onBtnCollectIslandClick() { //收获
        const island = this.focusedObjectNode ? this.focusedObjectNode.getComponent(Island) : null;
        if (!island) return;
        if (island.data.occupant == DataMgr.myUser.address) {
            BlockchainMgr.Instance.collectIslandMoney(island.data.id);
        }
    }
    onIslandSponsorLinkClick() {
        const island = this.focusedObjectNode ? this.focusedObjectNode.getComponent(Island) : null;
        if (island && island.data.sponsorLink) {
            window.open(island.data.sponsorLink);
        }
    }
    onIslandIWantSponsorClick() {
        const island = this.focusedObjectNode ? this.focusedObjectNode.getComponent(Island) : null;
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
    @property(cc.Node)
    btnCancelSail: cc.Node = null;
    @property(cc.Node)
    btnConfirmSail: cc.Node = null;

    onBtnSailClick() {
        if (!DataMgr.myUser) {
            ToastPanel.Toast('拥有方舟才能航行');
            return;
        }
        this.focusedObjectNode = null;
        this.editSailDestinationMode = true;
        this.newDestination = null;
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

        //能量
        let user = DataMgr.myUser;
        let curLocation = DataMgr.getUserCurrentLocation(user);
        let energyCost = DataMgr.getSailEnergyCost(user, this.newDestination.sub(curLocation).mag());
        if (DataMgr.getUserCurrentCargoData(user)['ch4'] < energyCost) {
            ToastPanel.Toast("甲烷燃料不足，强行发送交易可能失败");
        }

        console.log('ConfirmMove', this.newDestination);
        BlockchainMgr.Instance.callFunction('move', [this.newDestination.x, this.newDestination.y], 0, (resp) => {
            console.log("moveCallback: ", resp);
            if (resp.toString().substr(0, 5) != 'Error') {
                DialogPanel.PopupWith2Buttons('引擎开始预热，如果一切顺利，将在30秒内出发',
                    '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                        window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                    }, '确定', null);

                WorldUI.Instance.editSailDestinationMode = false;
            } else {
                ToastPanel.Toast('交易失败:' + resp);
            }
        });
    }

    //其他玩家
    onWatchCityClick() {
        if (this.focusedObjectNode) {
            const city = this.focusedObjectNode.getComponent(ArkInWorld);
            if (city) {
                CvsMain.OpenPanel(WatchOtherPanel, () => {
                    WatchOtherPanel.Instance.setAndRefresh(city.data);
                });
                DataMgr.fetchUserDataFromBlockchain(city.data.address, (data) => {
                    if (WatchOtherPanel.Instance) WatchOtherPanel.Instance.setAndRefresh(data);
                });
            }
        }
    }
    onTradeWithOtherClick() {
        console.log('TODO: Trade');
    }
    onAttackOtherClick() {
        if (this.focusedObjectNode) {
            const city = this.focusedObjectNode.getComponent(ArkInWorld);
            if (city) {
                CvsMain.OpenPanel(AttackOtherPanel, () => {
                    AttackOtherPanel.Instance.setAndRefresh(city.data);
                });
                DataMgr.fetchUserDataFromBlockchain(city.data.address, (data) => {
                    if (AttackOtherPanel.Instance) AttackOtherPanel.Instance.setAndRefresh(data);
                });
            }
        }
    }
    //海盗
    onWatchPirateClick() {
        if (this.focusedObjectNode) {
            const pirate = this.focusedObjectNode.getComponent(Pirate);
            if (pirate) {
                CvsMain.OpenPanel(WatchPiratePanel, () => {
                    WatchPiratePanel.Instance.setAndRefresh(DataMgr.getPirateData(pirate.index));
                });
                DataMgr.fetchPirateDataFromBlockchain(pirate.index, (data) => {
                    if (WatchPiratePanel.Instance) WatchPiratePanel.Instance.setAndRefresh(data);
                });
            }
        }
    }
    onAttackPirateClick() {
        if (this.focusedObjectNode) {
            const pirate = this.focusedObjectNode.getComponent(Pirate);
            if (pirate) {
                CvsMain.OpenPanel(AttackPiratePanel, () => {
                    AttackPiratePanel.Instance.setAndRefresh(DataMgr.getPirateData(pirate.index));
                });
                DataMgr.fetchPirateDataFromBlockchain(pirate.index, (data) => {
                    if (AttackPiratePanel.Instance) AttackPiratePanel.Instance.setAndRefresh(data);
                });
            }
        }
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

    //信息过滤
    onFilterToggle() {
        this.refreshData();
    }
}
