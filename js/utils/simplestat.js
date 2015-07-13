var SimpleStat = function(max, curr){


	this.max = max;
	this.val = (curr !== undefined) ? curr : this.max;
};

SimpleStat.serialize = function(simplestat){
	return {
		max: simplestat.max,
		val: simplestat.val
	}
};

SimpleStat.deserialize = function(blueprint){
	return new SimpleStat(blueprint.max, blueprint.val);
};

//------------------------------------------------------------------------------
//-----------------------------------------------------------------
//------------------------------------------------------------------------------

SimpleStat.prototype.isNegative = function(){
	return (this.val < 0);
};

SimpleStat.prototype.canSub = function(amount){
	return (this.val - amount) >= 0;
};

SimpleStat.prototype.fill = function(){
	this.val = this.max;
};

SimpleStat.prototype.sub = function(amount){
	this.val -= amount;
	return this;
};

SimpleStat.prototype.getValue = function(){
	return this.val;
};

SimpleStat.prototype.toString = function(){
	return "(" + this.val + ":" + this.max + ")";
};

SimpleStat.prototype.clone = function(){
	return new SimpleStat(this.max, this.curr);
};