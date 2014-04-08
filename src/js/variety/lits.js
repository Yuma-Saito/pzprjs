//
// パズル固有スクリプト部 ＬＩＴＳ・のりのり版 lits.js v3.4.1
//
(function(){

var k = pzpr.consts;

pzpr.classmgr.makeCustom('lits', {
//---------------------------------------------------------
// マウス入力系
MouseEvent:{
	mouseinput : function(){
		if(this.owner.playmode){
			if(this.mousestart || this.mousemove){ this.inputcell();}
		}
		else if(this.owner.editmode){
			if(this.mousestart || this.mousemove){ this.inputborder();}
		}
	},
	inputRed : function(){ this.dispRed();}
},

//---------------------------------------------------------
// 盤面管理系
Board:{
	hasborder : 1,

	getTetrominoInfo : function(rinfo){
		var tinfo = new this.owner.AreaInfo(); /* 各セルに入る黒マスのテトロミノの形が入る */
		for(var c=0;c<this.cellmax;c++){ tinfo.id[c]=null;}
		for(var r=1;r<=rinfo.max;r++){
			var clist = rinfo.room[r].clist.filter(function(cell){ return cell.isBlack();});
			var len = clist.length;
			if(len===4){
				var bx0=clist[0].bx, by0=clist[0].by, value=0;
				for(var i=1;i<len;i++){ value += (((clist[i].by-by0)>>1)*10+((clist[i].bx-bx0)>>1));}
				switch(value){
					case 13: case 15: case 27: case 31: case 33: case 49: case 51:
						for(var i=0;i<len;i++){ tinfo.id[clist[i].id]="L";} break;
					case 6: case 60:
						for(var i=0;i<len;i++){ tinfo.id[clist[i].id]="I";} break;
					case 14: case 30: case 39: case 41:
						for(var i=0;i<len;i++){ tinfo.id[clist[i].id]="T";} break;
					case 20: case 24: case 38: case 42:
						for(var i=0;i<len;i++){ tinfo.id[clist[i].id]="S";} break;
				}
			}
		}
		return this.getBlockInfo(tinfo);
	},
	getBlockInfo : function(tinfo){
		var dinfo = new this.owner.AreaInfo(); /* 同じ部屋に含まれる黒マスのつながり情報 */
		for(var fc=0;fc<this.cellmax;fc++){ dinfo.id[fc]=(tinfo.id[fc]!==null?0:null);}
		for(var fc=0;fc<this.cellmax;fc++){
			if(!dinfo.emptyCell(this.cell[fc])){ continue;}
			dinfo.addRoom();

			var stack=[this.cell[fc]];
			while(stack.length>0){
				var cell = stack.pop();
				if(!dinfo.emptyCell(cell)){ continue;}
				dinfo.addCell(cell);
				var list = cell.getdir4clist();
				for(var i=0;i<list.length;i++){
					if(tinfo.getRoomID(cell)==tinfo.getRoomID(list[i][0])){ stack.push(list[i][0]);}
				}
			}
		}
		return dinfo;
	}
},

CellList:{
	isSeqBlock : function(){
		var stack=(this.length>0?[this[0]]:[]), count=this.length, passed={};
		for(var i=0;i<count;i++){ passed[this[i].id]=0;}
		while(stack.length>0){
			var cell=stack.pop();
			if(passed[cell.id]===1){ continue;}
			count--;
			passed[cell.id]=1;
			var list = cell.getdir4clist();
			for(var i=0;i<list.length;i++){
				if(passed[list[i][0].id]===0){ stack.push(list[i][0]);}
			}
		}
		return (count===0);
	}
},

AreaBlackManager:{
	enabled : true
},
AreaRoomManager:{
	enabled : true
},

Flags:{
	use : true
},
"Flags@lits":{
	use    : true,
	redblk : true
},

//---------------------------------------------------------
// 画像表示系
Graphic:{
	initialize : function(){
		this.Common.prototype.initialize.call(this);

		if(this.owner.pid==='lits'){
			this.gridcolor = "rgb(48, 48, 48)";
			this.cellcolor = "rgb(96, 96, 96)";
			this.errcolor2 = "rgb(32, 32, 255)";
			this.setBGCellColorFunc('qans2');
		}
		else if(this.owner.pid==='norinori'){
			this.gridcolor = this.gridcolor_LIGHT;
			this.bcolor = "rgb(96, 224, 160)";
			this.bbcolor = "rgb(96, 127, 127)";
			this.setBGCellColorFunc('qsub1');
		}
	},
	paint : function(){
		this.drawBGCells();
		if(this.owner.pid==='lits'){ this.drawDotCells(false);}
		this.drawGrid();
		if(this.owner.pid==='norinori'){ this.drawBlackCells();}

		this.drawBorders();

		this.drawChassis();

		if(this.owner.pid==='norinori'){ this.drawBoxBorders(false);}
	}
},

//---------------------------------------------------------
// URLエンコード/デコード処理
Encode:{
	decodePzpr : function(type){
		var oldflag = ((type===k.URL_PZPRV3 && this.checkpflag("d"))||(type===k.URL_PZPRAPP && !this.checkpflag("c")));
		if(!oldflag || this.owner.pid==='norinori'){
			this.decodeBorder();
		}
		else{
			this.decodeLITS_old();
		}
	},
	encodePzpr : function(type){
		if(type===k.URL_PZPRV3 || this.owner.pid==='norinori'){
			this.encodeBorder();
		}
		else{
			this.outpflag='c';
			this.encodeBorder();
		}
	},

	decodeKanpen : function(){
		this.owner.fio.decodeAreaRoom();
	},
	encodeKanpen : function(){
		this.owner.fio.encodeAreaRoom();
	},

	decodeLITS_old : function(){
		var bstr = this.outbstr, bd = this.owner.board;
		for(var id=0;id<bd.bdmax;id++){
			var border = bd.border[id];
			var cell1 = border.sidecell[0], cell2 = border.sidecell[1];
			if(!cell1.isnull && !cell2.isnull && bstr.charAt(cell1.id)!=bstr.charAt(cell2.id)){ border.ques = 1;}
		}
		this.outbstr = bstr.substr(bd.cellmax);
	}
},
//---------------------------------------------------------
FileIO:{
	decodeData : function(){
		this.decodeAreaRoom();
		this.decodeCellAns();
	},
	encodeData : function(){
		this.encodeAreaRoom();
		this.encodeCellAns();
	},

	kanpenOpen : function(){
		this.decodeAreaRoom();
		this.decodeCellAns();
	},
	kanpenSave : function(){
		this.encodeAreaRoom();
		this.encodeCellAns();
	}
},

//---------------------------------------------------------
// 正解判定処理実行部
AnsCheck:{
	checkBlackCellInArea : function(cinfo, evalfunc){
		return this.checkAllBlock(cinfo, function(cell){ return cell.isBlack();}, function(w,h,a,n){ return evalfunc(a);});
	}
},
"AnsCheck@lits":{
	checkAns : function(){

		if( !this.check2x2BlackCell() ){ return 'bc2x2';}

		var rinfo = this.owner.board.getRoomInfo();
		if( !this.checkOverBlackCellInArea(rinfo) ){ return 'bkBcGt4';}

		if( !this.checkSeqBlocksInRoom() ){ return 'bkBcDivide';}

		if( !this.checkTetromino(rinfo) ){ return 'sbSameShape';}

		var binfo = this.owner.board.getBCellInfo();
		if( !this.checkOneArea(binfo) ){ return 'bcDivide';}

		if( !this.checkNoBlackCellInArea(rinfo) ){ return 'bkNoBcell';}

		if( !this.checkLessBlackCellInArea(rinfo) ){ return 'bkBcLt4';}

		return null;
	},

	checkOverBlackCellInArea : function(rinfo){
		return this.checkBlackCellInArea(rinfo, function(a){ return (a<=4);});
	},
	checkLessBlackCellInArea : function(rinfo){
		return this.checkBlackCellInArea(rinfo, function(a){ return (a>=4);});
	},

	// 部屋の中限定で、黒マスがひとつながりかどうか判定する
	checkSeqBlocksInRoom : function(){
		var result = true, bd = this.owner.board;
		for(var r=1;r<=bd.rooms.max;r++){
			var clist = bd.rooms.getClist(r).filter(function(cell){ return cell.isBlack()});
			if(!clist.isSeqBlock()){
				if(this.checkOnly){ return false;}
				clist.seterr(1);
				result = false;
			}
		}
		return result;
	},

	checkTetromino : function(rinfo){
		var dinfo = this.owner.board.getTetrominoInfo(rinfo), result = true;
		for(var r=1;r<=dinfo.max;r++){
			var clist = dinfo.room[r].clist;
			if(clist.length<=4){ continue;}
			if(this.checkOnly){ return false;}
			clist.seterr(2);
			result = false;
		}
		return result;
	}
},
"AnsCheck@norinori":{
	checkAns : function(){

		var binfo = this.owner.board.getBCellInfo();
		if( !this.checkOverBlackCell(binfo) ){ return 'bcGt2';}

		var rinfo = this.owner.board.getRoomInfo();
		if( !this.checkOverBlackCellInArea(rinfo) ){ return 'bkBcGt2';}

		if( !this.checkSingleBlackCell(binfo) ){ return 'bcLt2';}

		if( !this.checkSingleBlackCellInArea(rinfo) ){ return 'bkBcLt2';}

		if( !this.checkNoBlackCellInArea(rinfo) ){ return 'bkNoBcell';}

		return null;
	},

	checkOverBlackCell : function(binfo){
		return this.checkAllArea(binfo, function(w,h,a,n){ return (a<=2);} );
	},
	checkSingleBlackCell : function(binfo){
		return this.checkAllArea(binfo, function(w,h,a,n){ return (a>=2);} );
	},

	checkOverBlackCellInArea : function(rinfo){
		return this.checkBlackCellInArea(rinfo, function(a){ return (a<=2);});
	},
	checkSingleBlackCellInArea : function(rinfo){
		return this.checkBlackCellInArea(rinfo, function(a){ return (a!=1);});
	}
},

"FailCode@lits":{
	bkBcLt4 : ["黒マスのカタマリが４マス未満の部屋があります。","A room has three or less black cells."],
	bkBcGt4 : ["５マス以上の黒マスがある部屋が存在します。", "A room has five or more black cells."],
	sbSameShape : ["同じ形のテトロミノが接しています。","Some Tetrominos that are the same shape are Adjacent."]
},

"FailCode@norinori":{
	bcLt2 : ["１マスだけの黒マスのカタマリがあります。","There is a single black cell."],
	bcGt2 : ["２マスより大きい黒マスのカタマリがあります。","The size of a mass of black cells is over two."],
	bkBcLt2 : ["１マスしか黒マスがない部屋があります。","A room has only one black cell."],
	bkBcGt2 : ["２マス以上の黒マスがある部屋が存在します。","A room has three or mode black cells."]
}
});

})();