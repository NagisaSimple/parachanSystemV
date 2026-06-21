const TurretSettingTable = document.getElementById("TurretSettingTable");
const ValSetList = document.getElementById("ValSetList");
const XMLList = document.getElementById("XMLList");
const XMLListDetail = document.getElementById("XMLListDetail");
const OutMessage = document.getElementById("OutMessage");
const Axis = ["X", "Y", "Z"];

const PublicValList = [	//共通の変数
					//目標座標(グローバル軸,絶対座標)
					["{GroupName}TargetPositionGlobalX","sin(TargetHeading)*cos(TargetElevation)*TargetDistance+Longitude"],
					["{GroupName}TargetPositionGlobalY","sin(TargetElevation)*TargetDistance+Altitude"],
					["{GroupName}TargetPositionGlobalZ","cos(TargetHeading)*cos(TargetElevation)*TargetDistance+Latitude"],
					//回転行列
					["{GroupName}RotationMatrix11","cos({Heading})*cos({RollAngle})-sin({Heading})*sin({PitchAngle})*sin({RollAngle})"],
					["{GroupName}RotationMatrix12","cos({PitchAngle})*sin({RollAngle})"],
					["{GroupName}RotationMatrix13","-sin({Heading})*cos({RollAngle})-cos({Heading})*sin({PitchAngle})*sin({RollAngle})"],
					["{GroupName}RotationMatrix21","cos({Heading})*-sin({RollAngle})-sin({Heading})*sin({PitchAngle})*cos({RollAngle})"],
					["{GroupName}RotationMatrix22","cos({PitchAngle})*cos({RollAngle})"],
					["{GroupName}RotationMatrix23","sin({Heading})*sin({RollAngle})-cos({Heading})*sin({PitchAngle})*cos({RollAngle})"],
					["{GroupName}RotationMatrix31","sin({Heading})*cos({PitchAngle})"],
					["{GroupName}RotationMatrix32","sin({PitchAngle})"],
					["{GroupName}RotationMatrix33","cos({Heading})*cos({PitchAngle})"],
];

function GetSettings(){																	//設定の読み込み
	const KeyList = [
		"ActivateGroup", "CockpitX", "CockpitY", "CockpitZ",
		"PitchAngle", "Heading", "RollAngle",
		"Longitude", "Altitude", "Latitude",
		"RotatorRange", "CycleCount", "GroupName"
	];
	let Settings = {};
	for(let i = 0; i<KeyList.length; i++){
		Settings[KeyList[i]] = document.getElementById(KeyList[i]).value;
	}
	const TurretKeyList = ["Id", "PosX", "PosY", "PosZ", "HOffset", "EOffset", "HMin", "HMax", "EMin", "EMax", "Mode", "BulletSpeed", "Activator", "ZOffset"];
	let TurretSettings = [];
	for(let i = 0; i < TurretSettingTable.rows.length - 1; i++){
		let TurretSetting = {};
		for(let j = 0; j < TurretKeyList.length; j++){
			TurretSetting[TurretKeyList[j]] = document.getElementById("Turret" + i + TurretKeyList[j]).value;
		}
		TurretSettings.push(TurretSetting);
	}
	Settings["TurretSettings"] = TurretSettings;
	return Settings;
}

function GetValList(Settings){
	let ValList = [];
	for(let i = 0; i < PublicValList.length; i++){											//共通変数を登録
		ValList.push([PublicValList[i][0], PublicValList[i][1]]);
	}
		
	for(let i = 0; i < Settings["TurretSettings"].length; i++){								//タレット固有の変数を登録
		let TSettings = Settings["TurretSettings"][i];
		let Offset = [Settings["CockpitX"]-TSettings["PosX"], Settings["CockpitY"]-TSettings["PosY"], Settings["CockpitZ"]-TSettings["PosZ"]];
		for(let i = 0; i < 3; i++){
			Offset[i] = Math.round(Offset[i]*4096)/4096;
		}

		let TargetPositionName = [
			"{GroupName}" + TSettings["Id"] + "TargetPositionX",
			"{GroupName}" + TSettings["Id"] + "TargetPositionY",
			"{GroupName}" + TSettings["Id"] + "TargetPositionZ"
		];
		let TargetVelocityName = [
			"{GroupName}" + TSettings["Id"] + "TargetVelocityX",
			"{GroupName}" + TSettings["Id"] + "TargetVelocityY",
			"{GroupName}" + TSettings["Id"] + "TargetVelocityZ"
		];
		let TargetPosition = [0,0,0];
		let Enable = Settings["ActivateGroup"]											//発射可否用
		if(TSettings["Activator"] != "")
			Enable += "&" + TSettings["Activator"];
		if(TSettings["Mode"] == "偏差無し"){												//偏差ﾓｰﾄﾞ：偏差無し
			TargetPosition = [															//目標座標(ローカル軸,相対座標)
				"{GroupName}RotationMatrix11*({GroupName}TargetPositionGlobalX-{Longitude})+{GroupName}RotationMatrix12*({GroupName}TargetPositionGlobalY-{Altitude})+{GroupName}RotationMatrix13*({GroupName}TargetPositionGlobalZ-{Latitude})",
				"{GroupName}RotationMatrix21*({GroupName}TargetPositionGlobalX-{Longitude})+{GroupName}RotationMatrix22*({GroupName}TargetPositionGlobalY-{Altitude})+{GroupName}RotationMatrix23*({GroupName}TargetPositionGlobalZ-{Latitude})",
				"{GroupName}RotationMatrix31*({GroupName}TargetPositionGlobalX-{Longitude})+{GroupName}RotationMatrix32*({GroupName}TargetPositionGlobalY-{Altitude})+{GroupName}RotationMatrix33*({GroupName}TargetPositionGlobalZ-{Latitude})"
			];
			for(let j = 0; j < 3; j++){
				if(Offset[j] != 0)
					TargetPosition[0] += "+" + Offset[j];
			}

		}else{																			//偏差あり用の共通処理
			TargetPosition = [															//目標座標(グローバル軸,相対座標)
				"{GroupName}TargetPositionGlobalX-{Longitude}",
				"{GroupName}TargetPositionGlobalY-{Altitude}",
				"{GroupName}TargetPositionGlobalZ-{Latitude}"
			];
			for(let j = 0; j < 3; j++){
				if(Offset[j] != 0){
					TargetPosition[0] += "+{GroupName}RotationMatrix" + parseInt(j+1) + "1*" + Offset[j];
					TargetPosition[1] += "+{GroupName}RotationMatrix" + parseInt(j+1) + "2*" + Offset[j];
					TargetPosition[2] += "+{GroupName}RotationMatrix" + parseInt(j+1) + "3*" + Offset[j];
				}
			}
			for(let j = 0; j < 3; j++){														//目標座標,速度(グローバル軸,相対)を登録
				ValList.push(["{GroupName}" + TSettings["Id"] + "TargetPosition" + Axis[j], TargetPosition[j]]);
				ValList.push(["{GroupName}" + TSettings["Id"] + "TargetVelocity" + Axis[j], "rate({GroupName}" + TSettings["Id"] + "TargetPosition" + Axis[j] + ")"]);
			}

			if(TSettings["Mode"] == "機銃"){												//偏差ﾓｰﾄﾞ：機銃
				let Fuse = "sqrt(pow(" + TargetPositionName[0] + ",2)+pow(" + TargetPositionName[1] + ",2)+pow(" + TargetPositionName[2] + ",2))/" + TSettings["BulletSpeed"];
				let FuseName = "{GroupName}" + TSettings["Id"] + "Fuse";
				for(let j = 0; j < Settings["CycleCount"]; j++){										//反復処理
					ValList.push([FuseName, Fuse]);
					Fuse = "sqrt(pow(" + TargetPositionName[0] + "+" + TargetVelocityName[0] + "*" + FuseName + ",2)+pow("
										+ TargetPositionName[1] + "+" + TargetVelocityName[1] + "*" + FuseName + ",2)+pow("
										+ TargetPositionName[2] + "+" + TargetVelocityName[2] + "*" + FuseName + ",2))/" + TSettings["BulletSpeed"];
				}
				for(let j = 0; j < 3; j++)
					ValList.push([TargetPositionName[j], "(" + TargetPositionName[j] + "+" + TargetVelocityName[j] + "*" + FuseName + ")"]);
					
			}
			else if(TSettings["Mode"] == "ｷｬﾉﾝ(直射)" || TSettings["Mode"] == "ｷｬﾉﾝ(曲射)"){	//偏差ﾓｰﾄﾞ：Cannon系
				let CannonMode = (TSettings["Mode"] == "ｷｬﾉﾝ(直射)" ? "-" : "+");
				let HL = "sqrt(pow(" + TargetPositionName[0] + ",2)+pow(" + TargetPositionName[2] + ",2))";
				let VL = TargetPositionName[1];
				let Sqrt = "max(0,pow(" + TSettings["BulletSpeed"] + ",4)/pow(9.81*" + HL + ",2)-2*pow(" + TSettings["BulletSpeed"] + ",2)*" + VL + "/(9.81*pow(" + HL + ",2))-1";
				let SqrtName = "{GroupName}" + TSettings["Id"] + "Sqrt";
				let FuseName = "{GroupName}" + TSettings["Id"] + "Fuse";
				for(let j = 0; j < Settings["CycleCount"]; j++){										//反復処理
					let Sqrt = "max(0,pow(" + TSettings["BulletSpeed"] + ",4)/pow(9.81*" + HL + ",2)-2*pow(" + TSettings["BulletSpeed"] + ",2)*" + VL + "/(9.81*pow(" + HL + ",2))-1";
					ValList.push([SqrtName, Sqrt]);
					let Fuse = HL + "/" + TSettings["BulletSpeed"] + "*sqrt(1+pow(" + TSettings["BulletSpeed"] + ",4)/pow(9.81*" + HL + ",2)" + CannonMode + "2*sqrt(" + SqrtName + ")*pow(" + TSettings["BulletSpeed"] + ",2)/(9.81*" + HL + ")+" + SqrtName + ")";
					ValList.push([FuseName, Fuse]);
					HL = "sqrt(pow(" + TargetPositionName[0] + "+" + TargetVelocityName[0] + "*" + FuseName + ",2)+pow(" + TargetPositionName[2] + "+" + TargetVelocityName[2] + "*" + FuseName + ",2))";
					VL = "(" + TargetPositionName[1] + "+" + TargetVelocityName[1] + "*" + FuseName + ")";
				}
																							//偏差付き座標
				let HeadingW = "atan2(" + TargetPositionName[0] + "+" + TargetVelocityName[0] + "*" + FuseName + "," + TargetPositionName[2] + "+" + TargetVelocityName[2] + "*" + FuseName + ")";
				let ElevationW = "atan(pow(" + TSettings["BulletSpeed"] + ",2)/(9.81*" + HL + ")" + CannonMode + "sqrt(" + SqrtName + "))";
				let HeadingWName = "{GroupName}" + TSettings["Id"] + "HeadingW";
				let ElevationWName = "{GroupName}" + TSettings["Id"] + "ElevationW";
				ValList.push([HeadingWName, HeadingW]);
				ValList.push([ElevationWName, ElevationW]);
				ValList.push(["{GroupName}" + TSettings["Id"] + "TargetPositionX", "sin(" + HeadingWName + ")*cos(" + ElevationWName + ")"]);
				ValList.push(["{GroupName}" + TSettings["Id"] + "TargetPositionY", "sin(" + ElevationWName + ")"]);
				ValList.push(["{GroupName}" + TSettings["Id"] + "TargetPositionZ", "cos(" + HeadingWName + ")*cos(" + ElevationWName + ")"]);
				Enable += "&" + SqrtName + ">0";
			}
																							//座標系変換
			TargetPosition[0] = "{GroupName}RotationMatrix11*" + TargetPositionName[0] + "+{GroupName}RotationMatrix12*" + TargetPositionName[1] + "+{GroupName}RotationMatrix13*" + TargetPositionName[2];
			TargetPosition[1] = "{GroupName}RotationMatrix21*" + TargetPositionName[0] + "+{GroupName}RotationMatrix22*" + TargetPositionName[1] + "+{GroupName}RotationMatrix23*" + TargetPositionName[2];
			TargetPosition[2] = "{GroupName}RotationMatrix31*" + TargetPositionName[0] + "+{GroupName}RotationMatrix32*" + TargetPositionName[1] + "+{GroupName}RotationMatrix33*" + TargetPositionName[2];
		}
		
			let Heading = "atan2(" + TargetPosition[0] + "," + TargetPosition[2] + ")";				//方位角,行俯角
			let ElevationHL = "sqrt(pow(" + TargetPosition[0] + ",2)+pow(" + TargetPosition[2] + ",2))";
			if(TSettings["ZOffset"] != 0 && TSettings["ZOffset"] != "")
				ElevationHL += "-" + TSettings["ZOffset"];
			let Elevation = "atan2(" + TargetPosition[1] + "," + ElevationHL + ")";
		
		if(TSettings["HOffset"] != 0 && TSettings["HOffset"] != "")				//角度ｵﾌｾｯﾄの設定
			Heading = "deltaangle(" + TSettings["HOffset"] + "," + Heading + ")";
		if(TSettings["EOffset"] != 0 && TSettings["EOffset"] != "")
			Elevation = "deltaangle(" + TSettings["EOffset"] + "," + Elevation + ")";
		
		
		
		if(TSettings["HMin"] != "" && TSettings["HMax"] != ""){		//射角制限の設定
			Heading = "clamp(" + Heading + "," + TSettings["HMin"] + ","  + TSettings["HMax"] + ")";
			Enable += "&{GroupName}" + TSettings["Id"] + "Heading>" + TSettings["HMin"] + "&{GroupName}" + TSettings["Id"] + "Heading<" + TSettings["HMax"];
		}
		if(TSettings["EMin"] != "" && TSettings["EMax"] != ""){
			Elevation = "clamp(" + Elevation + "," + TSettings["EMin"] + ","  + TSettings["EMax"] + ")";
			Enable += "&{GroupName}" + TSettings["Id"] + "Elevation>" + TSettings["EMin"] + "&{GroupName}" + TSettings["Id"] + "Elevation<" + TSettings["EMax"];
		}
		
		if(Settings["ActivateGroup"] != ""){	//起動条件に可動範囲内の判定を追加
			Heading = "(" + Settings["ActivateGroup"] + "?" + Heading + ":0)";
			Elevation = "(" + Settings["ActivateGroup"] + "?" + Elevation + ":0)";
		}
		
		ValList.push(["{GroupName}" + TSettings["Id"] + "Heading", Heading + "/" + Settings["RotatorRange"]]);		//登録
		ValList.push(["{GroupName}" + TSettings["Id"] + "Elevation", Elevation + "/" + Settings["RotatorRange"]]);
		if(TSettings["Mode"] != "偏差無し")
			ValList.push(["{GroupName}" + TSettings["Id"] + "Enable", Enable]);


	}

	let Keys = Object.keys(Settings);	//共通設定の値を一括置換
	for(let i = 0; i < ValList.length; i++){
		for(let j = 0; j < Keys.length; j++){
			ValList[i][0] = ValList[i][0].replace(new RegExp("{" + Keys[j] + "}", "g"), Settings[Keys[j]]);
			ValList[i][1] = ValList[i][1].replace(new RegExp("{" + Keys[j] + "}", "g"), Settings[Keys[j]]);
		}
	}

	return ValList;
}


function printf(txt){
	OutMessage.innerText = txt;
}
let count = 0;
function Update(){	//進行管理
	let Settings = GetSettings();
	let ValList = GetValList(Settings);
	ValSet(ValList);
	count += 1;
}

//-----UI関連-----

function AddTurret(){	//タレットの設定枠を増やす
	let tr = document.createElement("tr");
	let TurretId = TurretSettingTable.rows.length - 1;
	tr.innerHTML = "<td align=\"center\"><input id=\"Turret" + TurretId + "Id\" type=\"text\" size=\"4\" value=\"Turret" + TurretId + "\" placeholder=\"X\"></td>";
	tr.innerHTML += "<td align=\"center\"><select id=\"Turret" + TurretId + "Mode\"><option>偏差無し</option><option>機銃</option><option>ｷｬﾉﾝ(直射)</option><option>ｷｬﾉﾝ(曲射)</option></select><br><input id=\"Turret" + TurretId + "BulletSpeed\" type=\"text\" size=\"3\" value=\"\" placeholder=\"弾速\"></td>";
	tr.innerHTML += "<td><table><tr><td><input id=\"Turret" + TurretId + "PosX\" type=\"text\" size=\"3\" value=\"\" placeholder=\"X\"></td><td><input id=\"Turret" + TurretId + "PosY\" type=\"text\" size=\"3\" value=\"\" placeholder=\"Y\"></td><td><input id=\"Turret" + TurretId + "PosZ\" type=\"text\" size=\"3\" value=\"\" placeholder=\"Z\"></td></tr></table>";
	tr.innerHTML += "<td align=\"center\"><input id=\"Turret" + TurretId + "HMax\" type=\"text\" size=\"2\" value=\"\" placeholder=\"max\"><br><input id=\"Turret" + TurretId + "HMin\" type=\"text\" size=\"2\" value=\"\" placeholder=\"min\"></td>";
	tr.innerHTML += "<td align=\"center\"><input id=\"Turret" + TurretId + "EMax\" type=\"text\" size=\"2\" value=\"\" placeholder=\"max\"><br><input id=\"Turret" + TurretId + "EMin\" type=\"text\" size=\"2\" value=\"\" placeholder=\"min\"></td>";
	tr.innerHTML += "<td align=\"center\"><input id=\"Turret" + TurretId + "EOffset\" type=\"text\" size=\"2\" value=\"\" placeholder=\"仰俯角\"><br><input id=\"Turret" + TurretId + "HOffset\" type=\"text\" size=\"2\" value=\"\" placeholder=\"方位角\"></td>";
	tr.innerHTML += "<td align=\"center\"><input id=\"Turret" + TurretId + "Activator\" type=\"text\" size=\"9\" value=\"\" placeholder=\"起動条件(固有)\"></td>";
	tr.innerHTML += "<td align=\"center\"><input id=\"Turret" + TurretId + "ZOffset\" type=\"text\" size=\"3\" value=\"\"></td>";
	TurretSettingTable.appendChild(tr);
}

function DeleteTurret(){	//タレットの設定枠を減らす
	let rowCount = TurretSettingTable.rows.length;//行数取得
	if(rowCount>2)
		TurretSettingTable.deleteRow(rowCount-1);//最終行を指定して削除
}

function ValSet(ValList){	//変数一覧の更新
	let Rows = ValSetList.rows.length;
	if(Rows>1)
		for(let i = 1; i < Rows; i++)//全行削除
			ValSetList.deleteRow(1);
	let xmlStr = "";
	for(let i = 0; i < ValList.length; i++){
		let tr = document.createElement("tr");
		tr.innerHTML = "<th>"+ValList[i][0]+"</th><td>"+ValList[i][1]+"</td>";
		ValSetList.appendChild(tr);
		xmlStr += "    <Setter variable=\""+XMLEncode(ValList[i][0])+"\" function=\""+XMLEncode(ValList[i][1])+"\" priority=\"0\" />\n";
	}
	XMLList.value = xmlStr;
	
	
}

function XMLEncode(Text){
	let TextOut = Text;
	TextOut = TextOut.replace(new RegExp("&", "g"), "&amp;");
	TextOut = TextOut.replace(new RegExp("\"", "g"), "&quot;");
	TextOut = TextOut.replace(new RegExp(">", "g"), "&gt;");
	TextOut = TextOut.replace(new RegExp("<", "g"), "&lt;");
	return TextOut;
}

function XMLCopy(){		//文字列をクリップボードへコピー
	if (navigator.clipboard){
		navigator.clipboard.writeText(XMLList.value);
	}
	else{
		XMLListDetail.open=true;
		XMLList.select();
		document.execCommand("Copy");
	}
}

AddTurret();

