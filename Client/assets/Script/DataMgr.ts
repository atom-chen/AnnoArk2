import WorldUI from "./WorldUI";
import MathUtil from "./Utils/MathUtil";

export class DataMgr {

    static myUser: UserData;

    static othersData = {};
    static allStars = [];
    static allIslandData = {};

    static BuildingConfig: BuildingInfo[];
    static CargoConfig: CargoInfo[];

    static outputRates = {};

    static pirateDatas = {};

    static cityMoveSpeed = 150;
    static raidCityCargoRate = 0.1;
    static safeZoneLine = 1567;
    static damagePerAttackCity = 0.1;
    static energyCostPerLyExpand = 0.01;
    static nukemissSpeed = 3600;
    static nukeRadius = 120;
    static totalPirateCnt = 1000;
    static pirateCargoC0 = 100;
    static pirateArmyC0 = 10;
    static piratePeriodTimestamp = 0;

    static timestampOffset = 0;//区块链时间戳比本地系统时间快多少毫秒

    private static inited = false;
    static init() {
        if (this.inited) return;
        this.inited = true;

        for (let index = 0; index < 300; index++) {
            let starInfo = DataMgr.getStarInfo(index);
            this.allStars.push(starInfo);
        }
    }

    static getBlockchainTimestamp() {
        return Number(new Date()) + this.timestampOffset;
    }

    static getUserCurrentLocation(user) {
        let lastLocation = new cc.Vec2(user.locationData.lastLocationX, user.locationData.lastLocationY);
        if (user.locationData.destinationX == null || user.locationData.destinationY == null) return lastLocation;
        let destination = new cc.Vec2(user.locationData.destinationX, user.locationData.destinationY);
        let dist = lastLocation.sub(destination).mag();
        let time = dist / (user.locationData.speed / 60 / 1000);
        let t = (Number(new Date()) - user.locationData.lastLocationTime) / time;
        return MathUtil.lerpVec2(lastLocation, destination, t, true);
    }

    static getEnergyCostOfAttack(distance: number, tankPower, chopperPower, shipPower) {
        return 1 * (tankPower + chopperPower + shipPower);
    }

    static calcCurrentMoneyInIsland(data: IslandData): number {
        const isMining = data.occupant && data.occupant.length > 0;
        let curMoney = data.money * (isMining ? Math.exp(-data.miningRate * (Number(new Date()) - data.lastMineTime) / (1000 * 3600)) : 1);
        return curMoney;
    }
    static getBuildingInfo(id: string) {
        return DataMgr.BuildingConfig.find(info => info.id == id);
    }
    static getCargoInfo(id: string) {
        return DataMgr.CargoConfig.find(info => info.id == id);
    }

    static getStarInfo(index: number): StarInfo {
        let a = (this.APHash1(index.toFixed() + 'startheta'));
        let b = (this.APHash1(index.toFixed() + 'rhostar'));
        let c = (this.APHash1(index.toFixed() + 'ironrate'));
        let d = (this.APHash1(index.toFixed() + 'energyrate'));
        let theta = a * Math.PI * 2;
        let l = b * 5000;
        let x = Math.cos(theta) * l;
        let y = Math.sin(theta) * l;
        let starInfo = new StarInfo();
        starInfo.x = x;
        starInfo.y = y;
        starInfo.ironAbundance = (1 - b) * c;
        starInfo.energyAbundance = (1 - b) * d;
        return starInfo;
    }
    static getPirateInfo(index) {
        if (index >= this.totalPirateCnt) {
            throw new Error("index must < totalPirateCnt." + index + '<' + this.totalPirateCnt);
        }
        let curPeriodTimestamp = this.piratePeriodTimestamp;
        let curTime = (new Date()).valueOf();
        if (curTime / 3600e3 >= Math.floor(curPeriodTimestamp / 3600e3 + 1)) {
            //newPeriod
            curPeriodTimestamp = Math.floor(curTime / 3600e3) * 3600e3;
            this.piratePeriodTimestamp = curPeriodTimestamp;
        }
        let seed = curPeriodTimestamp.toString() + index.toString();
        let random = this.APHash1(seed);//0~1  
        let lv = Math.floor(Math.pow(random, 3) * 15);//显示时+1
        let cargoMainFactor = lv * lv;//物资与lv^2成正比
        let armyMainFactor = lv * lv * lv;//部队数量与lv^3成正比

        let a = (this.APHash1(seed + 'theta'));
        let b = (this.APHash1(seed + 'rho'));
        let theta = a * Math.PI * 2;
        let l = Math.sqrt(b) * 5700;
        let x = Math.cos(theta) * l;
        let y = Math.sin(theta) * l;
        let pirateInfo = {};
        pirateInfo.x = x;
        pirateInfo.y = y;
        pirateInfo.lv = lv;
        //cargo
        let cargo = {};
        let cargoFactors = {
            silicon: 1,
            carbon: 0.7,
            iron: 0.5,
            chip: 0.05,
            deuter: 0.0001,
            //floatmod: 0.04,
        }
        for (let key in cargoFactors) {
            let c = (this.APHash1(seed + key));
            cargo[key] = Math.round(this.pirateCargoC0 * cargoMainFactor * c * cargoFactors[key]);
        }
        cargo.floatmod = cargoMainFactor;
        pirateInfo.cargo = cargo;
        //army
        let army = {};
        let armyFactors = {
            tank: 1,
            chopper: 0.8,
            ship: 0.2,
        }
        for (let key in armyFactors) {
            let c = (this.APHash1(seed + key));
            army[key] = Math.round(this.pirateArmyC0 * armyMainFactor * c * cargoFactors[key]);
        }
        pirateInfo.army = army;
        return pirateInfo;
    }
    static APHash1(str: string) {
        let hash = 0xAAAAAAAA;
        for (let i = 0; i < str.length; i++) {
            if ((i & 1) == 0) {
                hash ^= ((hash << 7) ^ str.charCodeAt(i) * (hash >> 3));
            }
            else {
                hash ^= (~((hash << 11) + str.charCodeAt(i) ^ (hash >> 5)));
            }
        }
        return hash / 0xAAAAAAAA / 1.5 + 0.5;
    }

    static getExpandCost(curExpandCnt: number, addExpandCnt: number) {
        let cost = 0;
        for (let i = curExpandCnt; i < curExpandCnt + addExpandCnt; i++) {
            cost += 0.0001 * Math.exp(0.1 * i);
        }
        return cost;
    }

    static getBuildingInfoItemWithLv(buildingId, itemName, lv) {
        let value = DataMgr.getBuildingInfo(buildingId)[itemName];
        let multi = DataMgr.getBuildingInfo('_upgradeRate')[itemName];
        if (!isNaN(multi) && multi > 0) {
            value = value * Math.pow(multi, lv);
        }
        return value;
    }

    static getUserWarehouseCap(cargoName) {
        let houseName = cargoName + 'house';
        let user = DataMgr.myUser;
        let cap = 0;
        for (let key in user.buildingMap) {
            let bdg = user.buildingMap[key];
            if (bdg && bdg.id === houseName) {
                cap += this.getBuildingInfoItemWithLv(houseName, 'Capacity', bdg.lv);
            }
        }
        return cap;
    }

    static getUserCurrentCargoData(user: UserData) {
        let curCargoData = {};
        for (let key in user.cargoData) {
            curCargoData[key] = user.cargoData[key];
        }
        let curTime = (new Date()).valueOf();
        let collectingHours = (curTime - user.lastCalcTime) / 3600000;
        let collectedIron = DataMgr.getUserCollectorRate(user, 'ironcoll') * collectingHours;
        let collectedEnergy = DataMgr.getUserCollectorRate(user, 'energycoll') * collectingHours;
        curCargoData['iron'] = Math.max(user.cargoData.iron, Math.min(DataMgr.getUserWarehouseCap('iron'), user.cargoData.iron + collectedIron));
        curCargoData['energy'] = Math.max(user.cargoData.energy, Math.min(DataMgr.getUserWarehouseCap('energy'), user.cargoData.energy + collectedEnergy));
        return curCargoData;
    }
    static getUserCollectorRate(user: UserData, buildingId: string) {
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        let rate = 0;
        for (let key in user.buildingMap) {
            let bdg = user.buildingMap[key];
            if (bdg && bdg.id === buildingId) {
                rate += DataMgr.getBuildingInfoItemWithLv(buildingId, 'Out0Rate', bdg.lv);
            }
        }
        return rate;
    }
}

export class StarInfo {
    x: number;
    y: number;
    ironAbundance: number;
    energyAbundance: number;
}
export class LocationData {
    speed: number; //ly/分钟
    lastLocationX: number;
    lastLocationY: number;
    lastLocationTime: number;
    destinationX: number;
    destinationY: number;
}
export class UserData {
    nickname: string;
    address: string; //区块链地址
    country: string;
    expandCnt = 0;
    state = 0; //0:sailing 1:collecting
    hull = 1; //完整度
    locationData: LocationData;
    expandMap = {
        //"-3,2": {order: 0}
    };
    buildingMap = {
        //"-3,2":{id:"ironcoll", lv:2, recoverTime:10302019313, justBuildOrUpgrade: true}
    };
    cargoData = {
        iron: 0,
        energy: 0,
    };
    collectingStarIndex = null;
    lastCalcTime = (new Date()).valueOf();
}
export class BuildingInfo {
    id: string;
    Name: string;
    Prefab: string;
    IronCost: number;
    Capacity;
    In0;
    In0Amt;
    In1;
    In1Amt;
    Out0;
    Out0Rate;
    CDPerUnit;
    MaxCD;
    MaxLevel;
    Pic: string;
    Description: string;
}
export class BuildingData {
    id: string;
    lv: number;
    recoverTime: number;
    justBuildOrUpgrade: boolean;
}
export class CargoInfo {
    id: string;
    Name: string;
}
export class CargoData {
    id: string;
    amount: number = 0;
}
export class TechInfo {
    id: string;
    Name: string;
    Work: number;
}
export class TechData {
    id: string;
    filledWork: number;
    finished: boolean;
}
export class MineInfo {
    polygonCollider: cc.PolygonCollider;
    points: cc.Vec2[];
}
export class IslandData {
    location: cc.Vec2;
    id: number;
    occupant: string; //当前占领者addr
    tankPower: number = 0;
    chopperPower: number = 0;
    shipPower: number = 0;
    money: number = 0; //里面还有多少nas
    sponsor: string;//赞助商账号
    sponsorName: string = '';//赞助商名称
    sponsorLink: string;//赞助商链接
    // minMiningSpeed: number = 0.04167; //NAS/h 挖矿速度
    miningRate: number = 0.02;///h 挖矿百分比速度，实际挖矿速度=max(minMiningSpeed, money*miningRate）
    balanceMap: number = 0; //当前占领者可收获的NAS
    lastMineTime: number; //当前数据的时间戳
    lastBattleTime: number;
}
export class IJ {
    i: number = 0;
    j: number = 0;

    clone() {
        let ij = new IJ();
        ij.i = this.i;
        ij.j = this.j;
        return ij;
    }
    static get ZERO(): IJ {
        return new IJ();
    }
}