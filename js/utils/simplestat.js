var SimpleStat = function(max, curr){

	
	this.max = max || 0;
	this.val = curr || this.max;
	this.isNegative = false;
}

SimpleStat.prototype.fill = function(){
	this.val = this.max;
}

SimpleStat.prototype.sub = function(amount){
	this.val -= amount;
	this.isNegative = (this.val < 0);
	return this;
}

SimpleStat.prototype.getValue = function(){
	return this.val;
}

SimpleStat.prototype.toString = function(){
	return "(" + this.val + ":" + this.max + ")";
}

SimpleStat.prototype.clone = function(){
	return new SimpleStat(this.max, this.curr);
}