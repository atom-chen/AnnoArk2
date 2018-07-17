"use strict";

let User = function (jsonStr) {
    if (jsonStr) {
        let obj = JSON.parse(jsonStr);
        for (let key in obj) {
            this[key] = obj[key];
        }
    } else {
        this.nickname = "";
        this.address = "";
        this.country = "";
        this.healMaxTimestamp = 0; //方舟何时恢复满血
        this.expandCnt = 0; //默认0

        this.expandMap = {
            //"-3,2": {order: 23//第几次扩建的}
        };

        this.buildingMap = {
            //"-3,2":{id:"ironcoll", lv:2, recoverTime:10302019313, justBuildOrUpgrade: true}
        };
        this.cargoData = {
            //test
            sand: 1000,
            silicon: 1000,
            ch4: 1000000,
        };
        this.myNukeList = [];
        this.lastCalcTime = (new Date()).valueOf();
    }
};

User.prototype = {
    toString: function () {
        return JSON.stringify(this);
    }
};


let BuildingInfo = function (jsonStr) {
    if (jsonStr) {
        let obj = JSON.parse(jsonStr);
        for (let key in obj) {
            this[key] = obj[key];
        }
    } else {
        this.id = 'no_id';
    }
};
BuildingInfo.prototype = {
    toString: function () {
        return JSON.stringify(this);
    }
};

let Island = function (jsonStr) {
    if (jsonStr) {
        let obj = JSON.parse(jsonStr);
        for (let key in obj) {
            this[key] = obj[key];
        }
    } else {
        this.index = 0;
        this.x = 0;
        this.y = 0;
        this.occupant = "";
        this.lastMineTime = 0; // 上次开始挖矿的时间
        this.army = {};
        this.money = new BigNumber(0);
        this.sponsor = "";
        this.sponsorName = "";
        this.sponsorLink = "";
        this.miningRate = new BigNumber(0.02);
        this.mineBalance = 0;
        this.lastCalcTime = 0;
    }
};
Island.prototype = {
    toString: function () {
        return JSON.stringify(this);
    }
};

let Pirate = function (jsonStr) {
    if (jsonStr) {
        let obj = JSON.parse(jsonStr);
        for (let key in obj) {
            this[key] = obj[key];
        }
    } else {
        this.index = 0;
        this.respawnTimestamp = 0;
        this.leftArmy = null;
        this.alive = true;
    }
};
Pirate.prototype = {
    toString: function () {
        return JSON.stringify(this);
    }
};

let Nuke = function (jsonStr) {
    if (jsonStr) {
        let obj = JSON.parse(jsonStr);
        for (let key in obj) {
            this[key] = obj[key];
        }
    } else {
        let locationData = {};
        locationData.speed = 0;
        locationData.lastLocationX = Math.cos(rad) * 5000;
        locationData.lastLocationY = Math.sin(rad) * 5000;
        locationData.destinationX = null;
        locationData.destinationY = null;
        locationData.lastLocationTime = (new Date()).valueOf();
        this.locationData = locationData;

        this.owner = "";
        this.alive = true;
        this.affectedCities = [];
    }
};
Nuke.prototype = {
    toString: function () {
        return JSON.stringify(this);
    }
};

let BigNumberDesc = {
    parse: function (jsonText) {
        return new BigNumber(jsonText);
    },
    stringify: function (obj) {
        return obj.toString();
    }
}

let GameContract = function () {
    LocalContractStorage.defineProperty(this, "adminAddress");
    LocalContractStorage.defineProperty(this, "totalIslandCnt");
    LocalContractStorage.defineProperty(this, "totalNas", BigNumberDesc);
    LocalContractStorage.defineProperty(this, "cityMoveSpeed");//方舟航行统一速度，km/h
    LocalContractStorage.defineProperty(this, "raidCityCargoRate");//每次掠夺城市，可以夺走当前存量多少比例的货物
    LocalContractStorage.defineProperty(this, "safeZoneLine");//安全区的边界的y值，暂定北回归线位置，23.5/90*6000=1567
    LocalContractStorage.defineProperty(this, "damagePerAttackCity");//每次攻打城市对城市造成的最大血量百分比伤害，同时也是每小时恢复的百分比
    LocalContractStorage.defineProperty(this, "energyCostPerLyExpand");
    LocalContractStorage.defineProperty(this, "nukemissSpeed");//洲际导弹飞行速度，km/h
    LocalContractStorage.defineProperty(this, "nukeRadius");//核弹爆炸半径，km
    LocalContractStorage.defineProperty(this, "totalPirateCnt");
    LocalContractStorage.defineProperty(this, "pirateCargoC0");
    LocalContractStorage.defineProperty(this, "pirateArmyC0");
    LocalContractStorage.defineProperty(this, "piratePeriodTimestamp");
    LocalContractStorage.defineProperty(this, "allUserList", {
        parse: function (jsonText) {
            return JSON.parse(jsonText);
        },
        stringify: function (obj) {
            return JSON.stringify(obj);
        }
    })
    LocalContractStorage.defineMapProperty(this, "allUsers", {
        parse: function (jsonText) {
            return new User(jsonText);
        },
        stringify: function (obj) {
            return obj.toString();
        }
    });
    LocalContractStorage.defineMapProperty(this, "allBuildingInfos", {

        parse: function (jsonText) {
            return JSON.parse(jsonText);
        },
        stringify: function (obj) {
            return JSON.stringify(obj);
        }
    });
    LocalContractStorage.defineMapProperty(this, "allCargoInfos", {

        parse: function (jsonText) {
            return JSON.parse(jsonText);
        },
        stringify: function (obj) {
            return JSON.stringify(obj);
        }
    });
    LocalContractStorage.defineProperty(this, "allIslands", {
        parse: function (jsonText) {
            return JSON.parse(jsonText);
        },
        stringify: function (obj) {
            return JSON.stringify(obj);
        }
    });
    LocalContractStorage.defineMapProperty(this, "allPirates", {
        parse: function (jsonText) {
            return new Pirate(jsonText);
        },
        stringify: function (obj) {
            return obj.toString();
        }
    });
    LocalContractStorage.defineProperty(this, "allNukeList", {
        parse: function (jsonText) {
            return JSON.parse(jsonText);
        },
        stringify: function (obj) {
            return JSON.stringify(obj);
        }
    })
    LocalContractStorage.defineMapProperty(this, "allNukes", {
        parse: function (jsonText) {
            return new Nuke(jsonText);
        },
        stringify: function (obj) {
            return obj.toString();
        }
    });
}

GameContract.prototype = {
    init: function () {
        this.adminAddress = Blockchain.transaction.from;
        this.totalNas = new BigNumber(0);
        this.cityMoveSpeed = 150;
        this.raidCityCargoRate = 0.1;
        this.safeZoneLine = 1567;
        this.damagePerAttackCity = 0.1;
        this.energyCostPerLyExpand = 0.01;
        this.nukemissSpeed = 3600;
        this.nukeRadius = 120;
        this.totalPirateCnt = 300;
        this.pirateCargoC0 = 100;
        this.pirateArmyC0 = 10;
        this.piratePeriodTimestamp = 0;
        this.allUserList = [];
        // this.allBuildingInfos = {};
        this.allIslands = [];
    },
    claimNewUser: function (nickname, country) {
        if (nickname.length > 100) {
            throw new Error("Nickname is too long.");
        }
        if (country.length > 20) {
            throw new Error("Country name is too long.");
        }
        let userAddress = Blockchain.transaction.from;
        let value = Blockchain.transaction.value;

        if (this.allUsers.get(userAddress) !== null) {
            throw new Error("Has claim new user before.");
        }

        this.totalNas = this.totalNas.plus(value);

        let user = new User();
        user.nickname = nickname;
        user.country = country;
        user.address = userAddress;
        user.locationData = this.getRandomSpawnLocation();
        this.allUsers.set(userAddress, user);
        let allUserList = this.allUserList;
        allUserList.push(userAddress);
        this.allUserList = allUserList;

        return {
            "success": true,
            "result_data": user
        };
    },
    editUser: function (nickname, country) {
        if (nickname.length > 100) {
            throw new Error("Nickname is too long.");
        }
        if (country.length > 20) {
            throw new Error("Country name is too long.");
        }
        let userAddress = Blockchain.transaction.from;
        let user = this.allUsers.get(userAddress);
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }

        user.nickname = nickname;
        user.country = country;
        this.allUsers.set(userAddress, user);

        return {
            "success": true,
            "result_data": user
        };
    },
    move: function (destinationX, destinationY) {
        let userAddress = Blockchain.transaction.from;
        let user = this.allUsers.get(userAddress);
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        if (destinationX === null || destinationY === null) {
            throw new Error("Parameters INVALID.");
        }
        this._recalcUser(user);
        let locationData = user.locationData;
        locationData.speed = this.cityMoveSpeed;
        locationData.destinationX = destinationX;
        locationData.destinationY = destinationY;

        let energyCost = this.getSailEnergyCost(user);
        if (user.cargoData.ch4 < energyCost) {
            throw new Error("User energy NOT enough.");
        }
        user.cargoData.ch4 -= energyCost;

        this.allUsers.set(userAddress, user);

        return {
            "success": true,
            "result_data": user
        };
    },
    expand: function (ijList) {//[[i,j],[i,j]]
        let userAddress = Blockchain.transaction.from;
        let user = this.allUsers.get(userAddress);
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        this._recalcUser(user);
        let newExpandCnt = 0;
        let needFloatmod = 0;
        for (let k = 0; k < ijList.length; k++) {
            let i = ijList[k][0];
            let j = ijList[k][1];
            if (!this._getCityIJExpanded(user, i, j)) {
                user.expandMap[i + ',' + j] = { order: user.expandCnt + newExpandCnt };
                newExpandCnt += 1;
                needFloatmod += this.getExpandNeedFloatmod(i, j);
            }
        }
        if (newExpandCnt == 0) {
            throw new Error("All ij are expanded:" + ijList);
        }
        user.cargoData.floatmod -= needFloatmod;
        if (user.cargoData.floatmod < 0) {
            throw new Error("floatmod NOT enough to expand." + needFloatmod);
        }

        user.expandCnt += newExpandCnt;

        this.allUsers.set(userAddress, user);
        return {
            "success": true,
            "result_data": user,
            "newExpandCnd": newExpandCnt
        };
    },
    build: function (i, j, buildingId) {
        let userAddress = Blockchain.transaction.from;
        let user = this.allUsers.get(userAddress);
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        this._recalcUser(user);
        if (!this._getCityIJExpanded(user, i, j)) {
            throw new Error("Build Failed. (" + i + ',' + j + ") has not yet expanded.");
        }
        if (user.buildingMap[i + ',' + j]) {
            throw new Error("Build Failed. (" + i + ',' + j + ") has a building.");
        }
        //buildingInfo
        let info = this.allBuildingInfos.get(buildingId);
        if (!info) {
            throw new Error("Build Failed. CANNOT find buildingID." + buildingId);
        }
        //check cargo & consume cargo
        for (let i = 0; i < 3; i++) {
            let itemName = "BuildMat" + i;
            let cargoName = info[itemName];
            if (cargoName) {
                let cntItemName = itemName + "Cnt";
                let needCnt = info[cntItemName];
                user.cargoData[cargoName] -= needCnt;
                if (user.cargoData[cargoName] < 0) {
                    throw new Error("Build Failed. Cargo NOT ENOUGH." + cargoName + "|" + user.cargoData[cargoName] + "<" + needCnt);
                }
            }
        }
        //build!
        let curTime = (new Date()).valueOf();
        user.buildingMap[i + ',' + j] = { id: buildingId, lv: 0, recoverTime: curTime + info.MaxCD / 4, justBuildOrUpgrade: true };

        this.allUsers.set(userAddress, user);
        return {
            "success": true,
            "result_data": user,
            "newBuilding": [i, j, buildingId]
        }
    },
    upgradeBuilding: function (i, j) {
        let userAddress = Blockchain.transaction.from;
        let user = this.allUsers.get(userAddress);
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        this._recalcUser(user);
        if (!user.buildingMap[i + ',' + j]) {
            throw new Error("Upgrade Failed. (" + i + ',' + j + ") has no building.");
        }
        let buildingId = user.buildingMap[i + ',' + j].id;
        //buildingInfo
        let info = this.allBuildingInfos.get(buildingId);
        if (!info) {
            throw new Error("Build Failed. CANNOT find buildingID." + buildingId);
        }
        //cur Level
        let curLv = user.buildingMap[i + ',' + j].lv;
        if (curLv >= info.MaxLevel) {
            throw new Error("Upgrade Failed. Building level is MAX.");
        }
        //check cargo & consume cargo
        for (let i = 0; i < 3; i++) {
            let itemName = "BuildMat" + i;
            let cargoName = info[itemName];
            if (cargoName) {
                let cntItemName = itemName + "Cnt";
                let needCnt = this.getBuildingInfoItemWithLv(buildingId, cntItemName, curLv + 1);
                user.cargoData[cargoName] -= needCnt;
                if (user.cargoData[cargoName] < 0) {
                    throw new Error("Build Failed. Cargo NOT ENOUGH." + cargoName + "|" + user.cargoData[cargoName] + "<" + needCnt);
                }
            }
        }
        //upgrade!
        user.buildingMap[i + ',' + j].lv += 1;

        let cdMulti = this.allBuildingInfos.get('_upgradeRate').MaxCD;
        let maxCD = info.MaxCD * Math.pow(cdMulti, curLv + 1);

        user.buildingMap[i + ',' + j].recoverTime = curTime + maxCD / 4;
        user.buildingMap[i + ',' + j].justBuildOrUpgrade = true;

        this.allUsers.set(userAddress, user);
        return {
            "success": true,
            "result_data": user,
            "newBuilding": [i, j, buildingId]
        }
    },
    moveBuilding: function (i, j, newI, newJ) {
        let userAddress = Blockchain.transaction.from;
        let user = this.allUsers.get(userAddress);
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        this._recalcUser(user);
        let oldIJ = i + ',' + j;
        let newIJ = newI + ',' + newJ;
        if (!user.buildingMap[oldIJ]) {
            throw new Error("moveBuilding Failed. (" + oldIJ + ") has no building.");
        }
        if (user.buildingMap[newIJ]) {
            throw new Error("moveBuilding Failed. (" + newIJ + ") has already had a building.");
        }
        user.buildingMap[newIJ] = user.buildingMap[oldIJ];
        user.buildingMap[oldIJ] = null;

        this.allUsers.set(userAddress, user);
        return {
            "success": true,
        }
    },
    demolish: function (i, j) {
        let userAddress = Blockchain.transaction.from;
        let user = this.allUsers.get(userAddress);
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        this._recalcUser(user);
        if (!user.buildingMap[i + ',' + j]) {
            throw new Error("Demolish Failed. (" + i + ',' + j + ") has no building.");
        }
        //buildingInfo
        let info = this.allBuildingInfos.get(buildingId);

        //recycle buildMat
        for (let i = 0; i < 3; i++) {
            let itemName = "BuildMat" + i;
            let cargoName = info[itemName];
            if (cargoName) {
                let cntItemName = itemName + "Cnt";
                let needCnt = this.getBuildingInfoItemWithLv(buildingId, cntItemName, curLv + 1);
                this._userAddCargo(user, cargoName, needCnt * 0.5);//回收最后一级升级消耗的建筑材料的50%
            }
        }

        //demolish!
        user.buildingMap[i + ',' + j] = null;

        this.allUsers.set(userAddress, user);
        return {
            "success": true,
            "result_data": user,
            "newBuilding": [i, j, buildingId]
        }
    },
    produce: function (i, j, amount) {
        if (amount != Math.floor(amount)) {
            throw new Error("amount must be Integer." + amount);
        }
        let userAddress = Blockchain.transaction.from;
        let user = this.allUsers.get(userAddress);
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        this._recalcUser(user);
        let building = user.buildingMap[i + ',' + j];
        let buildingId = building.id;
        if (!building) {
            throw new Error("Building NOT FOUND." + i + ',' + j);
        }
        let curTime = (new Date()).valueOf();
        if (building.recoverTime > curTime) {
            throw new Error("Production is still in Cooldown." + i + ',' + j + " recoverTime:" + building.recoverTime + " curTime:" + curTime);
        }

        //cur Level
        let curLv = building.lv;

        let maxQueue = this.getBuildingInfoItemWithLv(buildingId, "MaxQueue", curLv);
        if (amount >= maxQueue) {
            throw new Error("Produce failed because amount >= maxQueue." + maxQueue);
        }

        let info = this.allBuildingInfos.get(buildingId);
        if (!info) {
            throw new Error("CANNOT find buildingInfo." + buildingId);
        }

        //check input cargo & consume cargo
        for (let i = 0; i < 4; i++) {
            let itemName = "In" + i;
            let cargoName = info[itemName];
            if (cargoName) {
                let cntItemName = itemName + "Amt";
                let needCnt = this.getBuildingInfoItemWithLv(buildingId, cntItemName, curLv + 1) * amount;
                user.cargoData[cargoName] -= needCnt;
                if (user.cargoData[cargoName] < 0) {
                    throw new Error("Produce Failed. Cargo NOT ENOUGH." + cargoName + "|" + user.cargoData[cargoName] + "<" + needCnt);
                }
            }
        }

        //produce!
        user.cargoData[in0] -= in0Amount;
        user.cargoData[in1] -= in1Amount;
        this._userAddCargo(user, out0, amount);

        //add cd
        let cdPerUnit = this.getBuildingInfoItemWithLv(buildingId, 'CDPerUnit', building.lv);
        let cd = amount * cdPerUnit;

        building.recoverTime = curTime + cd * 60e3;
        building.justBuildOrUpgrade = null;

        this.allUsers.set(userAddress, user);
        return {
            "success": true,
            "result_data": user,
            "newCargo": [out0, amount]
        }
    },

    //=====PVE
    attackPirate: function (pirateIndex, army) {
        let pirateInfo = this.getPirateInfo(pirateIndex);// will refresh this.piratePeriodTimestamp
        let userAddress = Blockchain.transaction.from;
        let user = this.allUsers.get(userAddress);
        let curTs = (new Date()).valueOf();
        if (pirateInfo === null) {
            throw new Error("Error pirate index." + pirateIndex);
        }
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        this._recalcUser(user);
        let locationData = user.locationData;
        //check distance
        let dx = locationData.x - pirateInfo.x;
        let dy = locationData.y - pirateInfo.y;
        let dist = Math.sqrt(dx * dx + dy + dy);
        if (dist > 300) {
            throw new Error("Too far from the pirate." + pirateIndex + ", distance:" + dist);
        }

        let pirate = this.allPirates.get(pirateIndex);
        if (!pirate) {
            pirate = new Pirate();
            pirate.index = pirateIndex;
        }
        if (pirate.respawnTimestamp < this.piratePeriodTimestamp) {
            //respawn
            pirate.respawnTimestamp = this.piratePeriodTimestamp;
            pirate.leftArmy = pirateInfo.army;
            pirate.alive = true;
        }
        if (pirate.alive) {
            let res = this._battle(pirate.army.tank, pirate.army.chopper, pirate.army.ship, army.tank, army.chopper, pirate.army.ship);
            //attacker reduces army
            for (let key in army) {
                if (user.cargoData[key] < army[key]) {
                    throw new Error("Army NOT ENOUGH." + key);
                }
                user.cargoData[key] -= army[key];
            }
            let winnerLeftArmy = {};
            winnerLeftArmy.tank = res['left'][0];
            winnerLeftArmy.chopper = res['left'][1];
            winnerLeftArmy.ship = res['left'][2];
            if (res["win"]) { // pirate lost
                pirate.alive = false;
                //obtain cargos
                let cargo = pirateInfo.cargo;
                for (let key in cargo) {
                    this._userAddCargo(user, key, cargo[key]);
                }
                //attacker retrieves left army
                for (let key in winnerLeftArmy) {
                    user.cargoData[key] += winnerLeftArmy[key];
                }
            } else { // pirate win
                pirate.leftArmy = winnerLeftArmy;
            }

            this.allUsers.set(userAddress, user);
            this.allPirates.set(pirateIndex, pirate);

            return {
                "success": res["win"],
                "result_data": pirate
            };
        } else {
            throw new Error("Pirate NOT Alive." + pirateIndex);
        }
    },

    //=====PVP
    attackUserCity: function (enemyAddress, army) {
        let enemy = this.allUsers.get(enemyAddress);
        let userAddress = Blockchain.transaction.from;
        let user = this.allUsers.get(userAddress);
        let curTime = (new Date()).valueOf();
        if (enemy === null) {
            throw new Error("CANNOT find enemy." + enemyAddress);
        }
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }

        this._recalcUser(enemy);
        this._recalcUser(user);

        let locationData = user.locationData;
        let enemyLocationData = enemy.locationData;

        //check safe zone
        if (locationData.y >= this.safeZoneLine) {
            throw new Error("CANNOT attack other city when you are in Safe Zone." + locationData);
        }
        if (enemyLocationData.y >= this.safeZoneLine) {
            throw new Error("CANNOT attack the enemy in Safe Zone." + enemyLocationData);
        }

        //check distance
        let dx = locationData.x - enemyLocationData.x;
        let dy = locationData.y - enemyLocationData.y;
        let dist = Math.sqrt(dx * dx + dy + dy);
        if (dist > 100) {
            throw new Error("Too far from the enemy." + enemy + ", distance:" + dist);
        }

        //consume army & check
        for (let key in army) {
            user.cargoData[key] -= army[key];
            if (user.cargoData[key] < 0) {
                throw new Error("Army NOT ENOUGH." + key);
            }
        }

        let res = this._battle(enemy.cargoData.tank, enemy.cargoData.chopper, enemy.cargoData.ship, army.tank, army.chopper, army.ship);

        //enemy consume army
        enemy.cargoData.tank = 0;
        enemy.cargoData.chopper = 0;
        enemy.cargoData.ship = 0;

        if (res["win"]) { //敌方防守失败
            //retrieve army
            user.cargoData.tank += res['left'][0];
            user.cargoData.chopper += res['left'][1];
            user.cargoData.ship += res['left'][2];
            //转移物资
            for (let cargoName in enemy.cargoData) {
                let info = this.allCargoInfos.get(cargoName);
                if (info.CanRaid) {
                    let houseCap = this.getUserWarehouseCap(user.address, cargoName);
                    let transferAmt = Math.min(enemy.cargoData[cargoName] * this.raidCityCargoRate, houseCap - user.cargoData[cargoName]);
                    if (transferAmt > 0) {
                        enemy.cargoData[cargoName] -= transferAmt;
                        user.cargoData[cargoName] += transferAmt;
                    }
                }
            }

            //方舟受损
            let curCityHull = Math.min(1, 1 - (user.healMaxTimestamp - curTime) / 3600e3 * this.damagePerAttackCity);
            curCityHull -= this.damagePerAttackCity;
            if (curCityHull > 0) {
                //未沉没
                curCityHull.healMaxTimestamp = curTime + (1 - curCityHull) / this.damagePerAttackCity * 3600e3;
            } else {
                //沉没了
                this._cityDestroy(user);
            }
        } else { //我方进攻失败
            //enemy retrieve army
            enemy.cargoData.tank += res['left'][0];
            enemy.cargoData.chopper += res['left'][1];
            enemy.cargoData.ship += res['left'][2];
        }

        this.allUsers.set(enemyAddress, enemy);
        this.allUsers.set(userAddress, user);

        return {
            "success": res["win"],
        };
    },

    //=====Diamond Island
    attackIsland: function (islandIndex, army) {
        let island = this.allIslands.get(islandIndex);
        let userAddress = Blockchain.transaction.from;
        let user = this.allUsers.get(userAddress);
        let curTime = (new Date()).valueOf();
        if (island === null) {
            throw new Error("Error island index." + islandIndex);
        }
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        this._recalcUser(user);
        let locationData = user.locationData;
        //check distance
        let dx = locationData.x - island.x;
        let dy = locationData.y - island.y;
        let dist = Math.sqrt(dx * dx + dy + dy);
        if (dist > 100) {
            throw new Error("Too far from the island." + islandIndex + ", distance:" + dist);
        }

        let powerAttenuRate = new BigNumber(0.05);
        let hoursDelta = (new BigNumber(curTime - island.lastBattleTime)).div(1000 * 3600);
        let attenu = Math.exp(powerAttenuRate.times(hoursDelta).negated());
        for (let key in island.army) {
            island.army[key] = Math.round(island.army[key] * attenu);
        }
        island.lastBattleTime = curTime;
        if (island.occupant === "" || island.occupant === userAddress) { // 没有被占领或者自己占领
            if (island.occupant === "") {
                island.lastMineTime = curTime;
            }
            island.occupant = userAddress;

            for (let key in army) {
                if (user.cargoData[key] < army[key]) {
                    throw new Error("Army NOT ENOUGH." + key);
                }
                if (!island.army[key]) island.army[key] = army[key];
                else island.army[key] += army[key];
                user.cargoData[key] -= army[key];
                if (user.cargoData[key] < 0) {
                    throw new Error("NOT ENOUGH army." + key + ", " + army[key]);
                }
            }

            this.allIslands.set(islandIndex, island);
            this.allUsers.set(userAddress, user);
            return {
                "success": true,
                "result_data": user,
                "island": island,
            };
        } else {
            let res = this._battle(island.army.tank, island.army.chopper, 0, army.tank, army.chopper, 0)
            if (res["win"]) { // 防守失败
                this._collectIslandMoneyInternal(island); // 把上个玩家挖到的钱发给该玩家
                island = this.allIslands.get(islandIndex); // 这边要重新获取，因为money会改变
                island.occupant = userAddress;
                island.lastMineTime = curTime;
            }
            island.army.tank = res['left'][0];
            island.army.chopper = res['left'][1];
            island.army.ship = res['left'][2];

            for (let key in army) {
                if (user.cargoData[key] < army[key]) {
                    throw new Error("Army NOT ENOUGH." + key);
                }
                user.cargoData[key] -= army[key];
            }

            this.allUsers.set(userAddress, user);

            this.allIslands.set(islandIndex, island);
            return {
                "success": res["win"],
                "result_data": island
            };
        }
    },
    collectIslandMoney: function (islandId) {
        let island = this.allIslands.get(islandId);
        let userAddress = Blockchain.transaction.from;
        if (island === null || island.occupant !== userAddress) {
            throw new Error("Error island id.")
        }
        let mineMoney = this._collectIslandMoneyInternal(island);

        return {
            "success": true,
            "result_data": mineMoney
        };
    },
    _collectIslandMoneyInternal: function (island) {
        let curTime = (new Date()).valueOf();
        let hoursDelta = (new BigNumber(curTime - island.lastMineTime)).div(1000 * 3600);
        let leftNas = island.money.times(Math.exp(island.miningRate.times(hoursDelta).negated()).toString()).trunc();
        let miningNas = island.money.minus(leftNas);

        island.money = leftNas;
        island.lastMineTime = curTime;
        this.allIslands.set(island.id, island);
        this._transaction(island.occupant, miningNas);

        return miningNas;
    },

    //=====Sail
    getSailEnergyCost: function (user) {
        let locationData = user.locationData;
        if (locationData.destinationX === null || locationData.destinationY === null) return 0;
        let dX = locationData.destinationX - locationData.lastLocationX;
        let dY = locationData.destinationY - locationData.lastLocationY;
        let dist = Math.sqrt(dX * dX + dY * dY);
        return dist * (user.expandCnt + 5) * this.energyCostPerLyExpand;
    },

    //=====Nuke
    launchNuke: function (x, y) {
        let userAddress = Blockchain.transaction.from;
        let user = this.allUsers.get(userAddress);
        let curTime = (new Date()).valueOf();
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        this._recalcUser(user);

        //check safe zone
        if (user.locationData.y >= this.safeZoneLine) {
            throw new Error("CANNOT launch nuke when you are in Safe Zone." + user.locationData);
        }

        if (user.cargoData.nukemiss < 1) {
            throw new Error("nukemiss NOT ENOUGH.", user.cargoData.nukemiss);
        }
        user.cargoData.nukemiss -= 1;

        let nuke = new Nuke();
        nuke.owner = userAddress;

        let locationData = {};
        locationData.speed = this.nukemissSpeed;
        locationData.lastLocationX = user.locationData.lastLocationX;
        locationData.lastLocationY = user.locationData.lastLocationY;
        locationData.destinationX = x;
        locationData.destinationY = y;
        locationData.lastLocationTime = curTime;
        nuke.locationData = nuke;

        user.myNukeList.push(nuke);

        this.allUsers.set(userAddress, user);

        return {
            "success": true,
            "result_data": nuke,
            "index": user.myNukeList.length - 1
        }
    },
    triggerNuke: function (nukeIndex, checkEnemyList) {
        let userAddress = Blockchain.transaction.from;
        let user = this.allUsers.get(userAddress);
        let curTime = (new Date()).valueOf();
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }

        // this._recalcUser(user);
        this._recalcLocationData(user.locationData);

        //check safe zone
        if (user.locationData.y >= this.safeZoneLine) {
            throw new Error("CANNOT trigger nuke when you are in Safe Zone." + user.locationData);
        }

        let nuke = user.myNukeList[nukeIndex];
        if (!nuke.alive) {
            throw new Error("Nuke is NOT alive." + nukeIndex);
        }

        let locationData = nuke.locationData;
        let tmp = this._recalcLocationData(locationData);
        if (tmp.t < 1) {
            throw new Error("The nuke has NOT yet arrive at the destination.");
        }
        if (tmp.eta > curTime + 20 * 60e3) {
            throw new Error("The nuke is EXPIRED.");
        }

        nuke.alive = false;

        for (let i = 0; i < checkEnemyList.length; i++) {
            let enemyAddress = checkEnemyList[i];
            let enemy = this.allUsers.get(enemyAddress);
            if (enemy === null) {
                continue;
            }
            this._recalcUser(enemy);

            let enemyLocationData = enemy.locationData;

            //check safe zone
            if (enemyLocationData.y >= this.safeZoneLine) {
                continue;
            }

            //check distance
            let dx = locationData.x - enemyLocationData.x;
            let dy = locationData.y - enemyLocationData.y;
            let dist = Math.sqrt(dx * dx + dy + dy);
            if (dist > this.nukeRadius) {
                continue;
            }

            this._cityDestroy(enemy);
            this.allUsers.set(enemyAddress, enemy);

            nuke.affectedCities.push(enemyAddress);
        }

        this.allUsers.set(userAddress, user);
    },

    //=====Core Function
    _recalcLocationData: function (locationData) {
        let curTime = (new Date()).valueOf();
        if (locationData.destinationX === null || locationData.destinationY === null) return 0;
        let dX = locationData.destinationX - locationData.lastLocationX;
        let dY = locationData.destinationY - locationData.lastLocationY;
        let dist = Math.sqrt(dX * dX + dY * dY);
        let needTime = dist / (locationData.speed / 3600e3);
        let eta = locationData.lastLocationTime + needTime;
        let t = (curTime - locationData.lastLocationTime) / needTime;
        if (t < 1) {
            //not yet arrive at destination
            let curLoc = this._lerpVec2({ x: locationData.lastLocationX, y: locationData.lastLocationY }, { x: locationData.destinationX, y: locationData.destinationY }, t, false);
            locationData.lastLocationX = curLoc.x;
            locationData.lastLocationY = curLoc.y;
        } else {
            //arrived
            locationData.lastLocationX = locationData.destinationX;
            locationData.lastLocationY = locationData.destinationY;
            locationData.destinationX = null;
            locationData.destinationY = null;
        }
        locationData.lastLocationTime = curTime;
        return { t: t, eta: eta };
    },
    _recalcUser: function (user) {
        let curTime = (new Date()).valueOf();

        //location
        this._recalcLocationData(user.locationData);

        //collecting
        let collectingHours = (curTime - user.lastCalcTime) / 3600000;
        let collectedIron = this.getUserCollectorRate(user.address, 'ironcoll') * collectingHours;
        let collectedEnergy = this.getUserCollectorRate(user.address, 'energycoll') * collectingHours;
        user.cargoData.iron += collectedIron;
        user.cargoData.energy += collectedEnergy;

        user.lastCalcTime = curTime;

        this.allUsers.set(user.address, user);
    },
    _userAddCargo: function (user, cargoName, cargoAmount) {
        user.cargoData[cargoName] = Math.min(user.cargoData[cargoName] + cargoAmount, this.getUserWarehouseCap(user.address, cargoName));
    },
    _battle: function (bb1, cc1, dd1, bb2, cc2, dd2) { /*策划设定*/
        let c1 = 20; /*攻击方坦克攻击*/
        let d1 = 100; /*攻击方坦克HP*/
        let e1 = 50; /*攻击方直升机攻击*/
        let f1 = 40; /*攻击方直升机HP*/
        let g1 = 100; /*攻击方炮舰攻击*/
        let h1 = 20; /*攻击方炮舰HP*/

        let c2 = 20; /*防守方坦克攻击*/
        let d2 = 100; /*防守方坦克HP*/
        let e2 = 50; /*防守方直升机攻击*/
        let f2 = 40; /*防守方直升机HP*/
        let g2 = 100; /*防守方炮舰攻击*/
        let h2 = 20; /*防守方炮舰HP*/

        let k3 = 1; /*防守方属性加成*/
        let k1 = 0; /*防守方属性加成*/
        let k2; /*打肉系数-随机*/

        /*计算变量*/
        let y; /*战力差/剩余*/
        let a; /*剩余比例*/

        let z1; /*攻击方总战力*/
        let z2; /*防守方总战力*/

        /*输出变量*/
        let x; /*胜负，0为攻击方胜，1为防守方胜*/
        let bb; /*获胜方坦克数量*/
        let cc; /*获胜方直升机数量*/
        let dd; /*获胜方炮舰数量*/

        /*胜负判断*/
        z1 = (c1 * bb1 ** (k3) + e1 * cc1 ** (k3) + g1 * dd1 ** (k3)) *
            (d1 * bb1 + f1 * cc1 + h1 * dd1);

        z2 = (c2 * bb2 + e2 * cc2 ** (k3) + g2 * dd2 ** (k3)) * (1 + k1) *
            (d2 * bb2 + f2 * cc2 + h2 * dd2);

        y = z1 - z2;

        if (y >= 0) {
            x = false
        } else {
            x = true
        }

        /*获胜方剩余兵力*/
        if (x == 0) {
            a = y / z1;
            k2 = 1 - Math.random() * 0.3;
            bb = Math.floor(bb1 * a * k2);
            cc = Math.min(cc1, Math.floor(cc1 * a + bb1 * a * (1 - k2) * d1 / 2 / f1));
            dd = Math.min(dd1, Math.floor(dd1 * a + bb1 * a * (1 - k2) * d1 / 2 / h1));
        } else {
            a = -y / z2;
            k2 = 1 - Math.random() * 0.3;
            bb = Math.floor(bb2 * a * k2);
            cc = Math.min(cc2, Math.floor(cc2 * a + bb2 * a * (1 - k2) * d2 / 2 / f2));
            dd = Math.min(dd2, Math.floor(dd2 * a + bb2 * a * (1 - k2) * d2 / 2 / h2));

        }

        console.log(bb1, cc1, dd1, '|', bb2, cc2, dd2, '获胜方', x, '剩余', bb, cc, dd);
        return {
            "win": x,
            "left": [bb, cc, dd]
        }
    },
    _cityDestroy: function (user) {
        user.healMaxTimestamp = 0;
        //lost all cargo
        user.cargoData = {};
        this._userAddCargo(user, "sand", 100);
        //reset position
        this.locationData = this.getRandomSpawnLocation();
    },
    _transaction: function (targetAddress, value) {
        var result = Blockchain.transfer(targetAddress, value);
        console.log("transfer result:", result);
        Event.Trigger("transfer", {
            Transfer: {
                from: Blockchain.transaction.to,
                to: targetAddress,
                value: value
            }
        });
    },
    //=====Sponsor
    sponsor: function (islandId, sponsorName, link, ) {
        let island = this.allIslands.get(islandId);
        let value = Blockchain.transaction.value;
        let userAddress = Blockchain.transaction.from;
        let res;
        if (island === null) {
            throw new Error("Error island id.");
        }
        if (miningSpeed < 0.001) {
            throw new Error("miningSpeed must >= 0.001NAS/h." + miningSpeed);
        }
        this._collectIslandMoneyInternal(islandId);
        if (island.sponsor !== userAddress && value < island.money.times(1.2)) {
            throw new Error("value must > current money * 1.2. value:" + value + ", island.money:" + island.money);
        }
        if (island.sponsor !== userAddress) {
            //return money back
            this._transaction(island.sponsor, island.money);
            this.totalNas = this.totalNas.minus(island.money);
            island.sponsor = userAddress;
            island.money = value;
        } else {
            island.money = value.plus(island.money);
        }
        this.totalNas = value.plus(this.totalNas);
        island.sponsorName = sponsorName;
        island.sponsorLink = link;

        this.allIslands.set(islandId, island);

        return {
            "success": true,
            "island": island
        };
    },
    //=====Get
    getRandomSpawnLocation: function () {
        let rad = (0.25 + 0.5 * Math.random()) * Math.PI;
        let locationData = {};
        locationData.speed = 0;
        locationData.lastLocationX = Math.cos(rad) * 5000;
        locationData.lastLocationY = Math.sin(rad) * 5000;
        locationData.destinationX = null;
        locationData.destinationY = null;
        locationData.lastLocationTime = (new Date()).valueOf();
        return locationData;
    },
    _getCityIJExpanded: function (user, i, j) {
        if (Math.abs(i) <= 4 && Math.abs(j) <= 4) {
            return {};
        }
        return user.expandMap[i + ',' + j]
    },
    getMapInfo: function () {
        let allUsers = this.allUsers;
        let users = this.allUserList.map(function (address) {
            let user = allUsers.get(address);
            let simpleUser = {
                nickname: user.nickname,
                address: user.address,
                country: user.country,
                healMaxTimestamp: user.healMaxTimestamp,
                expandCnt: user.expandCnt,
                locationData: user.locationData,
                myNukeList: user.myNukeList,
            }
            return simpleUser;
        });
        let islands = [];
        for (let i = 0; i < this.allIslands.length; i++) {
            islands.push(this.allIslands.get(i));
        }
        //TODO: Pirate
        return {
            "success": true,
            "result_data": {
                "users": users,
                "islands": islands
            }
        };
    },
    getUserList: function () {
        return this.allUserList;
    },
    getUser: function (address) {
        return this.allUsers.get(address);
    },
    getPirateInfoteInfo: function (index) {
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
        let lv = random ^ 3 * 15;//显示时+1
        let cargoMainFactor = lv * lv;//物资与lv^2成正比
        let armyMainFactor = lv * lv * lv;//部队数量与lv^3成正比

        let a = (this.APHash1(seed + 'theta'));
        let b = (this.APHash1(seed + 'rho'));
        let theta = a * Math.PI * 2;
        let l = Math.sqrt(b) * 5000;
        let x = Math.cos(theta) * l;
        let y = Math.sin(theta) * l;
        let pirateInfo = {};
        pirateInfo.x = x;
        pirateInfo.y = y;
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
    },
    getPirateData: function (index) {
        if (index >= this.totalPirateCnt) {
            throw new Error("index must < totalPirateCnt." + index + '<' + this.totalPirateCnt);
        }
        return this.allPirates.get(index);
    },
    getExpandNeedFloatmod: function (i, j) {
        let radius = Math.max(Math.abs(i), Math.abs(j));
        let t = radius - 3;
        let res = t * t * t;
        return res;
    },
    getBuildingInfoItemWithLv: function (buildingId, itemName, lv) {
        let value = this.allBuildingInfos.get(buildingId)[itemName];
        let multi = this.allBuildingInfos.get('_upgradeRate')[itemName];
        if (!isNaN(multi)) {
            value = value * Math.pow(multi, lv);
        }
        return value;
    },
    getUserCollectorRate: function (userAddress, buildingId) {
        let user = this.allUsers.get(userAddress);
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        let info = this.allBuildingInfos.get(buildingId);
        let rate = 0;
        for (let key in user.buildingMap) {
            let bdg = user.buildingMap[key];
            if (bdg && bdg.id === buildingId) {
                rate += this.getBuildingInfoItemWithLv(buildingId, 'Out0Rate', bdg.lv);
            }
        }
        return rate;
    },
    getUserWarehouseCap: function (userAddress, cargoName) {
        let user = this.allUsers.get(userAddress);
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        let houseName = cargoName + 'house';
        let cap = 0;
        for (let key in user.buildingMap) {
            let bdg = user.buildingMap[key];
            if (bdg && bdg.id === houseName) {
                cap += this.getBuildingInfoItemWithLv(houseName, 'Capacity', bdg.lv);
            }
        }
        return cap;
    },
    //=====Math
    _lerpVec2: function (a, b, t, clamp) {
        if (clamp) t = Math.max(0, Math.min(1, t));
        let res = {};
        res.x = a.x * (1 - t) + b.x * t;
        res.y = a.y * (1 - t) + b.y * t;
        return res;
    },
    APHash1: function (str) {
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
    },
    //=====Admin
    takeRedundantNas: function (targetAddress, value) {
        if (Blockchain.transaction.from != this.adminAddress) {
            throw new Error("Permission denied.");
        }
        if (Blockchain.verifyAddress(targetAddress) == 0) {
            throw new Error("Illegal Address.");
        }

        this.totalNas = this.totalNas.minus(value);
        this._transaction(targetAddress, new BigNumber(value));
    },
    changeConst: function (constName, value) {
        if (Blockchain.transaction.from !== this.adminAddress) {
            throw new Error("Permission denied.");
        }
        this[constName] = value;
    },
    setBuildingInfo: function (infoArray) {
        if (Blockchain.transaction.from != this.adminAddress) {
            throw new Error("Permission denied.");
        }
        for (let key in this.allBuildingInfos) {
            this.allBuildingInfos.del(key);
        }
        for (let i = 0; i < infoArray.length; i++) {
            let info = infoArray[i];
            this.allBuildingInfos.set(info.id, info);
        }
        return {
            "success": true,
            "length": infoArray.length
        }
    },
    getBuildingInfo: function (id) {
        return this.allBuildingInfos.get(id);
    },
    setCargoInfo: function (infoArray) {
        if (Blockchain.transaction.from != this.adminAddress) {
            throw new Error("Permission denied.");
        }
        for (let key in this.allCargoInfos) {
            this.allCargoInfos.del(key);
        }
        for (let i = 0; i < infoArray.length; i++) {
            let info = infoArray[i];
            this.allCargoInfos.set(info.id, info);
        }
        return {
            "success": true,
            "length": infoArray.length
        }
    },
    getCargoInfo: function (id) {
        return this.allCargoInfos.get(id);
    },
    setIslandInfo: function (infoArray) {
        if (Blockchain.transaction.from != this.adminAddress) {
            throw new Error("Permission denied.");
        }
        if (infoArray.length < this.allIslands.length) {
            throw new Error("You can only set longer infoArray. >=" + this.allIslands.length);
        }
        let allIslands = this.allIslands;
        for (let i = 0; i < infoArray.length; i++) {
            let info = infoArray[i];
            if (i < allIslands.length) {
                allIslands[i].x = info.x;
                allIslands[i].y = info.y;
            } else {
                let newIsland = {};
                newIsland.x = info.x;
                newIsland.y = info.y;
                allIslands.push(newIsland);
            }
        }
        this.allIslands = allIslands;
        return {
            "success": true,
            "length": infoArray.length
        }
    },
    getIslandInfo: function (index) {
        return this.allIslands[index];
    }
}


module.exports = GameContract;