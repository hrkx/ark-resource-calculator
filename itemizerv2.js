var ark_popupRegistry = new Array();
var ark_popupIterator = 0;
var ark_popupDefaultLength = 50;
var ark_mouseX = 0;
var ark_mouseY = 0;
var ark_currentItemList = new Array();

function arkLaunchSearch(containerId) {
	$('#' + containerId).empty();
	var itemSub = $('#ark-search-name').val();
	var results = arkSearchItems(itemSub);
	for (var i = 0; i < results.length; i++) {
		var html = '<div class="ark-item-result">';
		html += '<div class="ark-item-name"><a class="ark-js-link" onclick="arkShowItemPerId(' + results[i].itemId + ',\'search-result\')">' + results[i].name + '</a></div>';
		html += '</div>';
		$('#' + containerId).append(html);
	}
}

function arkGetArkItemsVersion() {
	return ark_itemsVersion.ark.major + '.' + ark_itemsVersion.ark.minor;
}

function arkInjectCalculator(containerId) {
	var container = $('#' + containerId);
	var html = '<div class="basic-card"><div class="padding-box"><div id="ark-search-box"><input type="number" class="number-input" type="text" name="ark-calculator-quantity" id="ark-calculator-quantity" value="1" /><input class="item-input" type="text" placeholder="What do you want to make?" id="ark-search-item-match" name="ark-search-item-match" onKeyUp="arkSearchItemKeyPress(event);" /><div class="add-item" onclick="arkCalculatorAddItem();"><i class="fas fa-plus"></i></div></div>';
	html += '</div>';
	html += '<input type="hidden" name="ark-search-item-id" id="ark-search-item-id" value="0" />';
	//html += '<button class="add-item" onclick="arkCalculatorAddItem();">Add</button>';
	html += '</div>';
	html += '<div class="ads-bar"><center>';
	html += '<ins class="adsbygoogle"';
	html += 'style="display:block;width:320px;height:50px;"';
	html += 'data-ad-client="ca-pub-2078248236710487"';
	html += 'data-ad-slot="8805670831"></ins>';
	html += '<script>';
	html += '(adsbygoogle = window.adsbygoogle || []).push({});';
	html += '</script>';
	html += '</center></div>';
	html += '<div class="ark-calculator-totals-container">';
	html += '<div id="ark-calculator-totals"></div>';
	html += '</div>';
	html += '<div id="ark-search-item-matches"></div>';
	html += '';
	html += '<div id="ark-calculator-current-item"></div>';
  html += '<div class="basic-card clear"><div class="clear-all-items" onclick="arkCalculatorClearItems();">Clear All</div></div>';

	container.append(html);
}

function arkSearchItemKeyPress(evt) {
	var resultsContainer = $('#ark-search-item-matches');
	var searchInput = $('#ark-search-item-match');
	var prefix = searchInput.val();
	resultsContainer.empty();
	if (prefix.length > 0) {
		resultsContainer.show();
		resultsContainer.css('visibility', 'visible');
		resultsContainer.css('position', 'absolute');
		var offset = searchInput.offset();
		resultsContainer.css('top', (offset.top + searchInput.height()) - $(window).scrollTop() + 6);
		resultsContainer.css('left', offset.left - $(window).scrollLeft());
		var results = arkSearchItemsByPrefix(prefix) || innerText;
		for (var i = 0; i < results.length; i++) {
			var item = results[i];
			var ihtml = '<div class="ark-search-item-result"><a class="ark-js-link" onclick="arkSelectItem(' + item.itemId + ', \'ark-search-item-id\', \'ark-search-item-match\'); arkCalculatorAddItem();"><img src="https://tristan.games/apps/resourcecalc/images/' + item.image + '" width="24" height="24" />' + item.name + '</a></div>';
			resultsContainer.append(ihtml);
		}
		if (results.length == 0) {
			resultsContainer.slideDown();
		}
	} else {
		resultsContainer.fadeOut();
	}
}

function arkSelectItem(itemId, inputId, textId) {
	var item = arkGetItemById(itemId);
	var resultsContainer = $('#ark-search-item-matches');
	resultsContainer.hide();
	resultsContainer.css('visibility', 'hidden');
	if (item) {
		$('#' + inputId).val(itemId);
		$('#' + textId).val(item.name);
	}
}

function arkCalculatorClearItems() {
	ark_currentItemList = new Array();
	arkCalculatorRenderCurrentItem();
}

function arkCalculatorAddItem() {
	var _itemId = $('#ark-search-item-id').val();
	if (_itemId != 0) {
		var exists = false;
		var qty = parseInt($('#ark-calculator-quantity').val());
		var entry = {
			"itemId": _itemId,
			"count": qty,
		};
		for (var i = 0; i < ark_currentItemList.length; i++) {
			var costEntry = ark_currentItemList[i];
			if (costEntry.itemId == _itemId) {
				costEntry.count += qty;
				exists = true;
				break;
			}
		}
		if (!exists) {
			ark_currentItemList.push(entry);
		}
		arkCalculatorRenderCurrentItem();
	}
}

function arkCalculatorRemoveItem(entryIndex) {
	if (entryIndex < ark_currentItemList.length) {
		var oldArray = ark_currentItemList;
		ark_currentItemList = new Array();
		for (var i = 0; i < oldArray.length; i++) {
			if (i != entryIndex) {
				ark_currentItemList.push(oldArray[i]);
			}
		}
	}
	arkCalculatorRenderCurrentItem();
}

function arkCalculatorRenderCurrentItem() {
	$('#ark-calculator-current-item').empty();
	for (var i = 0; i < ark_currentItemList.length; i++) {;
		var item = arkGetItemById(ark_currentItemList[i].itemId);
		if (item) {
			var html = '<div class="ark-calculator-entry" id="ark-calculator-entry-' + i + '">';
			html += '<div class="ark-calculator-item-name">';
			html += '<a onclick="arkMouseOverPopup(' + item.itemId + ', \'ark-calculator-entry-' + i + '\');">' + item.name + '</a>';
			html += ' x ' + ark_currentItemList[i].count;
			html += '</div>';
			html += '<div class="remove-item" onclick="arkCalculatorRemoveItem(' + i + ');"><i class="far fa-trash-alt"></i></div>';
			html += '</div>';
			$('#ark-calculator-current-item').append(html);
		}
	}
	var costs = arkCalculateCostForItems(ark_currentItemList);
	var container = $('#ark-calculator-totals');
	container.empty();
	for (var i = 0; i < costs.length; i++) {
		if (costs[i].itemId2) {
			var item = arkGetItemById(costs[i].itemId);
			var item2 = arkGetItemById(costs[i].itemId2);
			var chtml = '<div class="item-totals" id="ark-calculator-totals-cost-' + i + '"><div class="padding-box">';
			chtml += '<img class="item-image" src="https://tristan.games/apps/resourcecalc/images/' + item.image + '" /><p class="amount">' + costs[i].count + '</p><a class="ark-js-link item-name">' + item.name + '</a> or <img width="24" height="24" src="https://tristan.games/apps/resourcecalc/images/' + item2.image + '" /><a class="ark-js-link item-name">' + item2.name + '</a>';
			chtml += '</div></div>';
			container.append(chtml);
		} else {
			var item = arkGetItemById(costs[i].itemId);
			var chtml = '<div class="item-totals" id="ark-calculator-totals-cost-' + i + '"><div class="padding-box">';
			chtml += '<img class="item-image" src="https://tristan.games/apps/resourcecalc/images/' + item.image + '" /><p class="amount">' + costs[i].count + '</p><a class="ark-js-link item-name">' + item.name + '</a>';
			chtml += '</div></div>';
			container.append(chtml);
		}
	}
}

function arkSearchItems(itemSubString) {
	var results = new Array();
	for (var i = 0; i < ark_items.length; i++) {
		var itemName = ark_items[i].name.toLowerCase();
		var index = itemName.indexOf(itemSubString.toLowerCase());
		if (index != -1) {
			results.push(ark_items[i]);
		}
	}
	return results;
}

function arkSearchItemsByPrefix(itemSubString) {
	var results = new Array();
	for (var i = 0; i < ark_items.length; i++) {
		var itemName = ark_items[i].name.toLowerCase();
		var index = itemName.indexOf(itemSubString.toLowerCase());
		if (index == 0) {
			results.push(ark_items[i]);
		}
	}
	return results;
}

function arkTestItem(containerId) {
	var itemId = $('#test_item_id').val();
	arkShowItemPerId(itemId, containerId);
}

function arkShowItemStats(containerId) {
	var container = $('#' + containerId);
	if (container) {
		for (var i = 0; i < ark_itemStats.length; i++) {
			container.append(ark_itemStats[i].name + ' : ' + ark_itemStats[i].id + '<br />');
		}
	}
}

function arkShowItemList(containerId) {
	var container = $('#' + containerId);
	if (container) {
		for (var i = 0; i < ark_items.length; i++) {
			container.append(ark_items[i].name + ' : ' + ark_items[i].itemId + '<br />');
		}
	}
}

function arkGetStatById(statId) {
	var stat = null;
	for (var i = 0; i < ark_itemStats.length; i++) {
		if (ark_itemStats[i].id == statId) {
			stat = ark_itemStats[i];
		}
	}
	return stat;
}

function arkGetCostByItemId(costs, itemId) {
	for (var i = 0; i < costs.length; i++) {
		if (costs[i].itemId == itemId) {
			return costs[i];
		}
	}
	return null;
}

function arkMergeCosts(costs, costs2) {
	var _costs = new Array();
	for (var i = 0; i < costs.length; i++) {
		_costs.push(costs[i]);
	}
	for (var i = 0; i < costs2.length; i++) {
		var cost = arkGetCostByItemId(_costs, costs2[i].itemId);
		if (cost) {
			cost.count = cost.count + costs2[i].count;
		} else {
			_costs.push(costs2[i]);
		}
	}
	return _costs;
}

function arkCalculateItemCost(itemId, _count) {
	var costs = new Array();
	var item = arkGetItemById(itemId);
	if (item) {
		if (item.recipe.length > 0) {
			for (var i = 0; i < item.recipe.length; i++) {
				if (item.recipe[i].itemId2) {
					var cost = {
						itemId: item.recipe[i].itemId,
						itemId2: item.recipe[i].itemId2,
						count: item.recipe[i].count * _count
					};
					costs.push(cost);
				} else {
					var _item = arkGetItemById(item.recipe[i].itemId);
					if (_item) {
						var _costs = arkCalculateItemCost(_item.itemId, item.recipe[i].count * _count);
						costs = arkMergeCosts(costs, _costs);
					}
				}
			}
		} else {
			var cost = {
				itemId: item.itemId,
				count: _count,
			}
			costs.push(cost);
		}
	}
	return costs;
}

function arkCalculateCostForItems(items) {
	var costs = new Array();
	for (var i = 0; i < items.length; i++) {
		var _costs = arkCalculateItemCost(items[i].itemId, items[i].count);
		costs = arkMergeCosts(costs, _costs);
	}
	return costs;
}

function arkShowItemPerId(itemId, containerId) {
	var item = null;
	for (var i = 0; i < ark_items.length; i++) {
		if (ark_items[i].itemId == itemId) {
			item = ark_items[i];
		}
	}
	if (item) {
		arkShowItemPopup(item, containerId);
	}
}

function arkShowItemPerName(itemName, containerId) {
	var item = null;
	for (var i = 0; i < ark_items.length; i++) {
		if (ark_items[i].name.toLowerCase() == itemName.toLowerCase()) {
			item = ark_items[i];
		}
	}
	if (item) {
		arkShowItemPopup(item, containerId);
	}
}

function arkGetItemById(itemId) {
	var item = null;
	for (var i = 0; i < ark_items.length; i++) {
		if (ark_items[i].itemId == itemId) {
			item = ark_items[i];
		}
	}
	return item;
}

function arkFormatDecomposes(decomposes) {
	if (decomposes == -1) {
		return "No";
	} else {
		var min = Math.floor(decomposes / 60);
		var str = "";
		if (min > 0) {
			str += min + ':';
		}
		var sec = decomposes % 60;
		if (sec < 10) {
			str += '0' + sec;
		} else {
			str += sec;
		}
		return str;
	}
}

function arkFormatWeight(itemWeight) {
	if (itemWeight == -1) {
		return 'Unknown';
	} else {
		return itemWeight;
	}
}

function arkNewPopup(arkItem) {
	ark_popupIterator++;
	var _id = ark_popupIterator;
	var popup = {
		id: _id,
		active: true,
		item: arkItem,
		tick: 0,
		length: ark_popupDefaultLength,
		middleX: 0,
		middleY: 0,
	};
	ark_popupRegistry.push(popup);
	return _id;
}

function arkInit() {
	$(document).mousemove(function(e) {
		ark_mouseX = e.pageX;
		ark_mouseY = e.pageY;
	}).mouseover();
	setInterval(tickPopups, 100000);
}

function tickPopups() {
	for (var i = 0; i < ark_popupRegistry.length; i++) {
		var popup = ark_popupRegistry[i];
		if (popup.active) {
			popup.tick++;
			if (popup.tick > popup.length) {
				popup.active = false;
				arkCloseItemPopup(popup.id);
			}
		}
	}
}

function arkTestItemCosts() {
	var itemCosts = [{
		itemId: 70,
		count: 3,
	}];
	var costs = arkCalculateCostForItems(itemCosts);
	$('#item-costs').append(costs.length);
}

function arkClearPopups() {
	for (var i = 0; i < ark_popupRegistry.length; i++) {
		arkCloseItemPopup(ark_popupRegistry[i].id);
	}
	ark_popupRegistry = new Array();
}

function arkMouseOverPopup(itemId, containerId) {
	var item = arkGetItemById(itemId);
	arkClearPopups();
	if (item) {
		var htmlId = arkShowItemPopup(item, containerId);
		$('#ark-popup-' + htmlId).css('z-index', 1);
	}
}

function arkMouseOverPopupByName(itemName, containerId) {
	var item = null;
	itemName = itemName.toLowerCase();
	for (var i = 0; i < ark_items.length; i++) {
		var iName = ark_items[i].name.toLowerCase();
		if (iName == itemName) {
			item = ark_items[i];
			break;
		}
	}
	arkClearPopups();
	if (item) {
		var htmlId = arkShowItemPopup(item, containerId);
	}
}

function arkShowItemPopup(item, containerId) {
	var htmlId = arkNewPopup(item);
	var html = '<div class="ark-item-popup" id="ark-popup-' + htmlId + '">';
  	html += '<div class="ark-item-popup-head">';
  	html += '<a class="close-btn" onclick="arkCloseItemPopup(' + htmlId + ');"><i class="fas fa-times"></i></a>';
	html += '<div class="ark-item-image-container"><img class="ark-item-image" src="https://tristan.games/apps/resourcecalc/images/' + item.image + '"/></div>';
	html += '</div>';
	html += '<div class="ark-item-name">' + item.name + '</div>';
	html += '<div class="ark-float-clear"></div>';
	if (item.stats.length > 0) {
		for (var i = 0; i < item.stats.length; i++) {
			var stat = arkGetStatById(item.stats[i].id);
			if (stat) {
			}
		}
	}
	if (item.recipe.length > 0) {
		html += '<div class="ark-item-recipe">';
		for (var i = 0; i < item.recipe.length; i++) {
			var count = item.recipe[i].count;
			if (count == 0.5) {
				count = "1/2";
			}
			html += '<div class="ark-item-recipe-item">';
			if (item.recipe[i].itemId2) {
				var ingItem = arkGetItemById(item.recipe[i].itemId);
				var ingItem2 = arkGetItemById(item.recipe[i].itemId2);
					html += '<img src="images/' + ingItem.image + '" class="ark-item-recipe-image" />' + ingItem.name + ' or <img src="images/' + ingItem2.image + '" class="ark-item-recipe-image" />' + ingItem2.name + '</div>';
				
			} else {
				var ingItem = arkGetItemById(item.recipe[i].itemId);
				if (ingItem) {
					html += '<img src="https://tristan.games/apps/resourcecalc/images/' + ingItem.image + '" class="ark-item-recipe-image" /><p class="popup-recipe-name">'+ count + '</p>' + ingItem.name + '</div>';
				}
			}
		}
	}
	html += '</div>';
	html += '</div>';
	$('#' + containerId).append(html);
	return htmlId;
}
function arkCloseItemPopup(popupId) {
  $('#ark-popup-' + popupId).remove() 
}

function arkCalculateCostWithMiddleTier(itemCount, currentLevel) {
	var _item = arkGetItemById(itemCount.itemId);
	var itemTrace = null;
	if (_item) {
		itemTrace = {
			item: _item,
			count: itemCount.count,
			inners: new Array(),
			level: currentLevel,
		};
		if (_item.recipe.length == 0) {
			return itemTrace;
		} else {
			for (var j = 0; j < _item.recipe.length; j++) {
				var itemRecipe = _item.recipe[j];
				var _itemCount = {
					"itemId": itemRecipe.itemId,
					"count": itemRecipe.count * itemCount.count,
				};
				innerTrace = arkCalculateCostWithMiddleTier(_itemCount, currentLevel + 1);
				itemTrace.inners.push(innerTrace);
			}
		}
	}
	return itemTrace;
}

function arkCalculateItemsTrace(itemsCount) {
	var traces = new Array();
	for (var i = 0; i < itemsCount.length; i++) {
		var itemCount = itemsCount[i];
		var trace = arkCalculateCostWithMiddleTier(itemCount, 0);
		traces.push(trace);
	}
	return traces;
}

function arkRawItemTracesCosts(traces) {
	var costs = new Array();
	for (var i = 0; i < traces.length; i++) {
		var trace = traces[i];
		var _costs = arkRawItemTraceCosts(trace);
		for (var j = 0; j < _costs.length; j++) {
			var exists = false;
			for (var k = 0; k < costs.length; k++) {
				if (costs[k].itemId == _costs[j].itemId) {
					costs[k].count += _costs[j].count;
					exists = true;
					break;
				}
			}
			if (!exists) {
				costs.push(_costs[j]);
			}
		}
	}
	return costs;
}

function arkRenderItemTraceHTML(itemTrace) {
	var html = '<div class="ark-calculator-level-' + itemTrace.level + ' ark-item-trace">';
	html += itemTrace.item.name + ' ' + itemTrace.count;
	for (var i = 0; i < itemTrace.inners.length; i++) {
		var _inner = itemTrace.inners[i];
		html += arkRenderItemTraceHTML(_inner);
	}
	html += '</div>';
	return html;
}

function arkCalculatorShowItemTrace(itemTrace, containerId) {
	var container = $('#' + containerId);
	var html = '<div class="ark-calculator-top-level">';
	html += arkRenderItemTraceHTML(itemTrace);
	html += '</div>';
	container.empty();
	container.append(html);
}

function arkRawItemTraceCosts(itemTrace) {
	var costs = new Array();
	if (itemTrace.inners.length == 0) {
		costs.push({
			"itemId": itemTrace.item.itemId,
			"count": itemTrace.count
		});
		return costs;
	} else {
		for (var i = 0; i < itemTrace.inners.length; i++) {
			var _inner = itemTrace.inners[i];
			var innerCosts = arkRawItemTraceCosts(_inner);
			for (var j = 0; j < innerCosts.length; j++) {
				var _cost = innerCosts[j];
				var exists = false;
				for (var k = 0; k < costs.length; k++) {
					if (costs[k].itemId == _cost.itemId) {
						costs[k].count += _cost.count;
						exists = true;
						break;
					}
				}
				if (!exists) {
					costs.push(_cost);
				}
			}
		}
	}
	return costs;
}
 arkInit();
    arkInjectCalculator('ark-calculator');
