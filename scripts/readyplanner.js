
/* TODO
 * Documentation
 * React?
 * Login w/ SQL?
 * Calorie Counter?
 */

/// DOCUMENT ELEMENTS

// File Input
const recipeBookInput = document.querySelector("#recipe_book_input");

// Recipe List
const recipeList = document.querySelector('#recipes');

// Buttons
const addIngredientButton = document.querySelector("#add_ingredient_button");
const removeIngredientButton = document.querySelector("#remove_ingredient_button");
const saveRecipeButton = document.querySelector("#save_recipe_button");
const removeRecipeButton = document.querySelector("#remove_recipe_button");
const newRecipeButton = document.querySelector("#new_recipe_button");
const saveRecipeBookButton = document.querySelector("#save_recipe_book_button");
const generatePlanButton = document.querySelector("#generate_plan_button");

// Meal Times
const breakfastBox = document.querySelector("#breakfast");
const lunchBox = document.querySelector("#lunch");
const dinnerBox = document.querySelector("#dinner");
const snackBox = document.querySelector("#snack");

// Ingredient Fields
const ingredientList = document.querySelector('#ingredients');
const iNameField = document.querySelector('#ingredient_name');
const iPreparationField = document.querySelector('#preparation');
const iAmountField = document.querySelector('#ingredient_amount');
const iUnitField = document.querySelector('#unit');
	
// Text Fields
const recipeNameField = document.querySelector("#recipe_name");
const servingCountField = document.querySelector("#serving_count");
const procedureField = document.querySelector("#procedure");
const linkField = document.querySelector("#recipe_link");

/// GLOBALS

var recipeBook = [];
var recipeBookName = "";
var lastRecipeName = "";
var saved = true;
var fridge = [];
const MEAL_TIMES = ['breakfast', 'lunch', 'dinner', 'snack'];
const PAD_AMOUNT = 25;
const CHANCE_INITIAL = 8;
const CHANCE_INTERVAL = 1;
const CHANCE_MAX = 10;
const SKIP_LEFTOVER_CHANCE = 4; // 1 in n chance to skip leftovers
var lastMeals = {
	breakfast: null,
	lunch: null,
	dinner: null,
	snack: null
};
	
/// EVENT LISTENERS

// Add Ingredient
addIngredientButton.onclick = (e) => {
	// Ingredients must have a name and a measurement
	if (iNameField.value == '' || iAmountField.value == '') {
		if (iNameField.value == '') {
			console.warn("Not Added: Ingredient name must not be empty.");
		}
		if (iAmountField.value == '') {
			console.warn("Not Added: Ingredient amount must not be empty.");
		}
		return;
	}
	let prepValue = null;
	if (iPreparationField.value != '') {
		prepValue = iPreparationField.value;
	}
	let ingredient = {"name": iNameField.value, "preparation": prepValue, 
			"amount": parseFloat(iAmountField.value), "unit": iUnitField.value};
	
	let key = iNameField.value;
	if (prepValue != null) {
		key += " (" + iPreparationField.value + ")";
	}
	key += ", "+ iAmountField.value + " " + iUnitField.value;
	
	const newIngredient = new Option(key, ingredient);
	ingredientList.add(newIngredient);
	saved = false;
	
	// Reset text boxes for convenience
	iNameField.value = '';
	iPreparationField.value = '';
	iAmountField.value = 1;
};

// Remove Ingredient(s)
removeIngredientButton.onclick = (e) => {
	while (ingredientList.selectedIndex != -1) {
		ingredientList.remove(ingredientList.selectedIndex)
	}
	saved = false;
};

// Load Selected Recipe
recipeList.onchange = (e) => {	
	if (lastRecipeName != "") { 
		// Ask to save if there are unsaved changes
		if (!saved && confirm("Do you want to save changes to " + lastRecipeName + "?")) {
			saveRecipe(lastRecipeName);
		}
		clearForms();
	}
	loadRecipe(recipeList.options[recipeList.selectedIndex].label);
}

// Manual Save Recipe
saveRecipeButton.onclick = (e) => {
	saveRecipe(recipeList.options[recipeList.selectedIndex].label);
};

// Remove Recipe
removeRecipeButton.onclick = (e) => {
	let lastIndex = recipeList.selectedIndex;
	while (recipeList.selectedIndex != -1) {
		lastIndex = recipeList.selectedIndex;
		let recipeToDelete = recipeList.options[recipeList.selectedIndex].label;
		recipeBook.every(recipe => {
			if (recipeToDelete == recipe.name){
				recipeBook.splice(recipeBook.indexOf(recipe), 1);
				return false;
			}
			return true;
		});
		recipeList.remove(recipeList.selectedIndex)
	}
	clearForms();
	
	// If the entry deleted is the first, we need to handle the recipe change differently
	if (lastIndex == 0 && recipeList.length > 0) {
		recipeList.selectedIndex = lastIndex;
		loadRecipe(recipeList.options[lastIndex].label);
	} else if (lastIndex > 0) {
		recipeList.selectedIndex = lastIndex - 1;
		loadRecipe(recipeList.options[lastIndex - 1].label);
	}
};

// New Recipe
newRecipeButton.onclick = (e) => {
	let recipeName = prompt("Enter Recipe Name:", "");
	if (validName(recipeName)){
		recipeBook.push({ 'name': recipeName, 'time': [], 'ingredients': [], 
				'servings': 1, 'procedure': '', 'recipe_link': '' });
		recipeList.add(new Option(recipeName));
	}
};

// File Uploaded
recipeBookInput.onchange = (e) => {
	let rawBook = recipeBookInput.files[0];
	if (rawBook == null) {
		console.warn('Upload Cancelled');
		return;
	}
	recipeBookName = rawBook.name;
	let reader = new FileReader();
	reader.readAsText(rawBook);
	reader.onload = function() {
		let newRecipeBook = JSON.parse(reader.result).recipes;
		let addedRecipes = [];
		newRecipeBook.every(recipe => {
			if (validName(recipe.name, true)) {
				recipeBook.push(recipe);
				addedRecipes.push(recipe);
			}
			return true;
		});
		console.log('Recipes added:\n', addedRecipes);
		populateRecipeList(addedRecipes);
	};
	reader.onerror = function() {
		console.log(reader.error);
	};
};

// Checkbox Listeners
breakfastBox.onchange = (e) => { saved = false; };
lunchBox.onchange = (e) => { saved = false; };
dinnerBox.onchange = (e) => { saved = false; };
snackBox.onchange = (e) => { saved = false; };	

// Text Field Listeners
servingCountField.onchange = (e) => { saved = false; };
procedureField.onchange = (e) => { saved = false; }; 
linkField.onchange = (e) => { saved = false; }; 

// Name Change Listener; must be saved immediately as names are key values
recipeNameField.onchange = (e) => { 
	let recipeListEntry = recipeList.options[recipeList.selectedIndex];
	if (!validName(recipeNameField.value)) {
		recipeNameField.value = recipeListEntry.label;
		return;
	}
	recipeBook.every(recipe => {
		if (recipe.name === recipeListEntry.label) {
			recipeListEntry.label = recipeNameField.value;
			recipeListEntry.text = recipeNameField.value;
			recipe.name = recipeNameField.value;
			return false;
		}
		return true;
	});
};

// Save Recipe Book
saveRecipeBookButton.onclick = (e) => {
	let downloadElement = document.createElement('a');
    downloadElement.setAttribute('href', 'data:text/plain; charset=utf-8,' + 
			encodeURIComponent(JSON.stringify({ "recipes": recipeBook }, null, 4)));
    downloadElement.setAttribute('download', 'recipe_book.json');
    downloadElement.style.display = 'none';
    document.body.appendChild(downloadElement);
    downloadElement.click();
    document.body.removeChild(downloadElement);
};

// Generate Meal Plan
generatePlanButton.onclick = (e) => {
	if (recipeBook.length < 1) {
		alert('Cannot generate a meal plan without recipes.');
		return;
	}
	let bFound = false;
	let lFound = false;
	let dFound = false;
	let sFound = false;
	recipeBook.every( recipe => {
		if (!bFound && recipe.time.includes('breakfast')) {
			console.log('breakfast found: ' + recipe.name);
			bFound = true;
		}
		if (!lFound && recipe.time.includes('lunch')) {
			console.log('lunch found: ' + recipe.name);
			lFound = true;
		}
		if (!dFound && recipe.time.includes('dinner')) {
			console.log('dinner found: ' + recipe.name);
			dFound = true;
		}
		if (!sFound && recipe.time.includes('snack')) {
			console.log('snack found: ' + recipe.name);
			sFound = true;
		}
		return !(bFound && lFound && dFound && sFound);
	});
	if (!(bFound && lFound && dFound && sFound)) {
		alert('Cannot generate a meal plan unless there is at least 1 recipe for each meal time.');
		return;
	}
	let plan = [];
	for (let day = 0; day < 7; day++) {
		let day = {
			breakfast: chooseMeal('breakfast'),
			lunch: chooseMeal('lunch'),
			dinner: chooseMeal('dinner'),
			snack: chooseMeal('snack')
		};
		plan.push(day);
	}
	let shoppingList = getShoppingList(plan);
	generateMealPlan(plan, shoppingList);
};

/// HELPER FUNCTIONS

/**
 * Creates an XLSX file representing a meal plan and shopping list and downloads it
 */
function generateMealPlan(plan, shoppingList) {
	console.log(plan, shoppingList);
	let workbook = XLS.utils.book_new();
	
	// convert plan to an Array Of Arrays (this could probably be done cleaner or not at all)
	let planAOA = [['', 'Breakfast', 'Lunch', 'Dinner', 'Snack']];
	for (dayNum in plan) {
		planAOA.push(['Day ' + dayNum, plan[dayNum].breakfast.name, plan[dayNum].lunch.name, plan[dayNum].dinner.name, plan[dayNum].snack.name]);
	}
	planAOA.push(['', '', '', '', '']);
	planAOA.push(['Leftovers in Fridge:', '', '', '', '']);
	fridge.every( leftover => {
		planAOA.push(['' + leftover.servings + ' ' + leftover.recipe.name, '', '', '', '']);
	});
	
	shoppingList.unshift(['Item Name', 'Item Amount']);
	
	let planWorksheet = XLS.utils.aoa_to_sheet(planAOA);
	let shoppingListWorksheet = XLS.utils.aoa_to_sheet(shoppingList);
	XLSX.utils.book_append_sheet(workbook, planWorksheet, 'Meal Plan');
	XLSX.utils.book_append_sheet(workbook, shoppingListWorksheet, 'Shopping List');
	XLSX.writeFile(workbook, 'meal_plan.xlsx');
}

/**
 * Generates an array-of-arrays containg the ingredients of every recipe in the plan
 */
function getShoppingList(plan) {
	let shoppingItems = {};
	plan.every(meal => {
		for (let i = 0; i < MEAL_TIMES.length; i++) {
			meal[MEAL_TIMES[i]].ingredients.every(ingredient => {
				if (ingredient.name in shoppingItems) {
					if (ingredient.unit in shoppingItems[ingredient.name]) {
						shoppingItems[ingredient.name][ingredient.unit] += ingredient.amount;
					} else {
						shoppingItems[ingredient.name][ingredient.unit] = ingredient.amount;
					}
				} else {
					shoppingItems[ingredient.name] = {};
					shoppingItems[ingredient.name][ingredient.unit] = ingredient.amount;
				}
				return true;
			});
		}
		return true;
	});
	shoppingList = [];
	for (const ingredient in shoppingItems) {
		let name = '' + ingredient;
		let amount = '';
		let firstElement = true;
		for (const unit in shoppingItems[ingredient]) {
			if (!firstElement){
				amount += ', ';
			}
			amount += '' + shoppingItems[ingredient][unit] + ' ' + unit;
			firstElement = false;
		}
		shoppingList.push([name, amount]);
	}
	return shoppingList;
}

/**
 * Collects meal options and intelligently chooses a unique meal
 */
function chooseMeal(mealTime) {
	let options = [];
	// If there are leftovers in the fridge, chance to use them first.
	if (fridge.length > 0 && Math.floor(Math.random() * SKIP_LEFTOVER_CHANCE) > 0) {
		fridge.every(leftover => {
			if (leftover.recipe.time.includes(mealTime)) {
				options.push(leftover);
			}
			return true;
		});
		if (options.length > 0) {
			let leftover = pickMeal(options, true);
			leftover.servings -= 1;
			if (leftover.servings == 0) {
				fridge.splice(fridge.indexOf(leftover), 1);
			}
			return leftover.recipe;
		}
	}
	// If there are no leftovers or we skipped, choose something new to make
	recipeBook.every(recipe => {
		if (recipe.time.includes(mealTime)) {
			let inFridge = false;
			fridge.every(leftover => {
				if (leftover.recipe.name == recipe.name){
					inFridge = true;
					return false;
				}
				return true;
			});
			if (!inFridge) {
				options.push(recipe);
			}
		}
		return true;
	});
	
	// there's a chance that options will be empty, if so pick without restriction. only happens with small recipeBook
	if (options.length < 1) {
		recipeBook.every(recipe => {
			if (recipe.time.includes(mealTime)) {
				options.push(recipe);
			}
			return true;
		});
	}
	let meal = pickMeal(options);
	if (meal.servings > 1) {
		fridge.push({ recipe: meal, servings: meal.servings - 1 });
	}
	return meal;
}

/**
 * Chooses a random meal from a list of options
 */
function pickMeal(options, fromFridge) {
	fromFridge = fromFridge || false;
	let meal = options[Math.floor(Math.random() * options.length)];
	let mealName;
	if (fromFridge) {
		mealName = meal.recipe.name;
	} else {
		mealName = meal.name;
	}
	// if the same meal is recently, chance to skip
	let ateRecently = lastMeals.breakfast === mealName || lastMeals.lunch === mealName || lastMeals.dinner === mealName || lastMeals.snack === mealName;
	if (options.length > 1 && ateRecently) {
		chance = INITIAL_CHANCE + ((lastMeals.breakfast === mealName? 1 : 0) 
				+ (lastMeals.lunch === mealName? 1 : 0) + (lastMeals.dinner === mealName? 1 : 0) 
				+ (lastMeals.snack === mealName? 1 : 0)) * CHANCE_INTERVAL;
		options.splice(options.indexOf(meal), 1);
		if (chance > Math.floor(Math.random() * CHANCE_MAX)){
			meal = options[Math.floor(Math.random() * options.length)];
		}
	}
	return meal;
}


/**
 * Checks the validity of recipe names.
 */
function validName(newName, quiet) {
	// we sometimes want the alerts to be silenced
	quiet = quiet || false;
	// check if string is just whitespace
	if (newName.match(/^\s*$/) != null) {
		if (quiet) {
			console.warn('Recipe not added due to invalid name: "' + newName + '".');
		} else {
			alert('Error: Name must not be only whitespace characters.\nChanges Reverted.');
		}
		return false;
	}
	if (duplicate(newName)) {
		if (quiet) {
			console.warn('Recipe not added due to duplication: "' + newName + '".');
		} else {
			alert('Error: Recipe names must be unique.\nChanges Reverted.');
		}
		return false;
	}
	return true;
}

/**
 * Check if name exists in recipeBook
 */
function duplicate(newName) {
	let dupe = false;
	recipeBook.every(recipe => {
		if (recipe.name === newName) {
			dupe = true;
			return false;
		}
		return true;
	});
	return dupe;
}

/**
 * Imports new recipes to recipe list
 */
function populateRecipeList(recipeBook) {
	recipeBook.every(recipe => {
		let recipeOption = new Option(recipe.name);
		recipeList.add(recipeOption);
		return true;
	});
}

/**
 * Finds recipe data from recipe book and loads it into the active fields
 */
function loadRecipe(recipeName) {
	recipeBook.every(recipe => {
		if (recipe.name === recipeName) {
			recipeNameField.value = recipe.name;
			servingCountField.value = recipe.servings;
			procedureField.value = recipe.procedure;
			linkField.value = recipe.recipe_link;
			breakfastBox.checked = recipe.time.includes('breakfast');
			lunchBox.checked = recipe.time.includes('lunch');
			dinnerBox.checked = recipe.time.includes('dinner');
			snackBox.checked = recipe.time.includes('snack');
			
			recipe.ingredients.every(ingredient => {
				let key = ingredient.name;
				if (ingredient.preparation != null) {
					key += " (" + ingredient.preparation + ")";
				}
				key += ", "+ ingredient.amount + " " + ingredient.unit;
				let newIngredient = new Option(key);
				ingredientList.add(newIngredient);
				return true;
			});
			return false;
		}
		return true;
	});
	lastRecipeName = recipeName;
}

/**
 * Save changes to a recipe to the Recipe Book
 */
function saveRecipe(recipeName) {
	recipeBook.every(recipe => {
		if (recipe.name === recipeName) {
			recipe.name = recipeNameField.value;
			recipe.servings = servingCountField.value;
			recipe.procedure = procedureField.value;
			recipe.recipe_link = linkField.value;
			
			if (breakfastBox.checked ) {
				if (!recipe.time.includes('breakfast')) {
					recipe.time.push('breakfast');
				}
			} else {
				if (recipe.time.includes('breakfast')) {
					recipe.time.splice(recipe.time.indexOf('breakfast'), 1);
				}
			}
			if (lunchBox.checked ) {
				if (!recipe.time.includes('lunch')) {
					recipe.time.push('lunch');
				}
			} else {
				if (recipe.time.includes('lunch')) {
					recipe.time.splice(recipe.time.indexOf('lunch'), 1);
				}
			}
			if (dinnerBox.checked ) {
				if (!recipe.time.includes('dinner')) {
					recipe.time.push('dinner');
				}
			} else {
				if (recipe.time.includes('dinner')) {
					recipe.time.splice(recipe.time.indexOf('dinner'), 1);
				}
			}
			if (snackBox.checked ) {
				if (!recipe.time.includes('snack')) {
					recipe.time.push('snack');
				}
			} else {
				if (recipe.time.includes('snack')) {
					recipe.time.splice(recipe.time.indexOf('snack'), 1);
				}
			}
			
			// add new ingredients
			let ingredientNames = [];
			[...ingredientList.options].every(ingredient => {
				// Regex Groups: 1 - name, 3 - preparation, 4 - amount, 5 - unit
				let match = ingredient.label.match(/([\w '&-]*)( \((.*)\))?, (.*) (.*)/);
				ingredientNames.push(match[1]);
				let ingredientFound = false;
				recipe.ingredients.every(oldIngredient => {
					if (oldIngredient.name == match[1]) {
						ingredientFound = true;
						oldIngredient.preparation = match[3];
						oldIngredient.amount = parseFloat(match[4]);
						oldIngredient.unit = match[5];
						return false;
					}
					return true;
				});
				if (!ingredientFound) {
					recipe.ingredients.push({'name': match[1], 'preparation': match[3], 
							'amount': parseFloat(match[4]), 'unit': match[5]});
				}
				return true;
			});
			
			// delete old ingredients
			let ingredientsToDelete = [];
			recipe.ingredients.every(oldIngredient => {
				if (!ingredientNames.includes(oldIngredient.name)) {
					ingredientsToDelete.push(oldIngredient);
				}
				return true;
			});
			ingredientsToDelete.every(ingredient => {
				recipe.ingredients.splice(recipe.ingredients.indexOf(ingredient), 1);
				return true;
			});
			return false;
		}
		return true;
	});
	saved = true;
	console.log('Recipe Saved');
}

/**
 * Deletes data from all fields
 */
function clearForms() {
	recipeNameField.value = '';
	servingCountField.value = '';
	breakfastBox.checked = false;
	lunchBox.checked = false;
	dinnerBox.checked = false;
	snackBox.checked = false;
	procedureField.value = '';
	linkField.value = '';
	
	while (ingredientList.length > 0) {
		ingredientList.remove(0);
	}
}