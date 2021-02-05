class Recipe {
    constructor(attributes) {
      let whitelist = ["id", "name", "active"]
      whitelist.forEach(attr => this[attr] = attributes[attr])
    }

    static container() {
      return this.c ||= document.querySelector("#recipes")
    }

    static all() {
      return Auth.fetch("http://localhost:3000/recipes")
        .then(recipeArray => {
          this.collection = recipeArray.map(attrs => new Recipe(attrs))
          let renderedRecipes = this.collection.map(recipe => recipe.render())
          this.container().append(...renderedRecipes);
          return this.collection
        })
      .catch(error => new FlashMessage(error));
    }

    static findById(id) {
      return this.collection.find(recipe => recipe.id == id);
    }

    static create(formData) {
      return Auth.fetch("http://localhost:3000/recipes", {
        method: 'POST',
        body: JSON.stringify({recipe: formData})
      })
      .then(recipeAttributes => {
        let recipe = new Recipe(recipeAttributes);
        this.collection.push(recipe);
        this.container().appendChild(recipe.render());
        new FlashMessage({type: 'success', message: 'Recipe Added!'})
        return recipe;
      })
      .catch(error => new FlashMessage(error));
    }

    show() {
      return Auth.fetch(`http://localhost:3000/recipes/${this.id}`)
        .then(({id, ingredientsAttributes}) => {
          Ingredient.loadByRecipe(id, ingredientsAttributes)
          this.markActive()
        })
        .catch(err => {
          return res.text().then(error => Promise.reject(err))
        })
    }

    //The unhide() method sets the style of the recipe element to show itself
    unhide() {
      this.element.style.display = "";
    }
    //The hide() method sets the style of the recipe element to hide itself
    hide() {
      this.element.style.display = "none";
    }

    markActive() {
      if(Recipe.activeList) {
        Recipe.activeList.active = false;
        Recipe.activeList.element.classList.replace('bg-purple-600', 'bg-purple-400');
      }
      Recipe.activeList = this;
      this.active = true;
      this.element.classList.replace('bg-purple-400', 'bg-purple-600');
    }


    delete() {
      return Auth.fetch(`http://localhost:3000/recipes/${this.id}`, {
        method: "DELETE"
      })
        .then(({id}) => {
          let index = Recipe.collection.findIndex(ing => ing.id == id)
          Recipe.collection.splice(index, 1);
          this.element.remove();
          if(id == Ingredient.active_recipe_id) {
            Ingredient.container().innerHTML = `<li class="my-2 p-4">Pick a Recipe to see the ingredients required.</li>`
          }
          return this;
        })
        .catch(error => new FlashMessage({type: 'error', message: error}))
    }

    render() {
      this.element ||= document.createElement('li');
      this.element.classList.set(`my-2 px-4 bg-purple-400 grid grid-cols-12 sm:grid-cols-6`);
      
      this.nameLink ||= document.createElement('a');
      this.nameLink.classList.set("py-4 col-span-10 sm:col-span-4 selectRecipe");
      this.nameLink.textContent = this.name;
      this.nameLink.dataset.recipeId = this.id;
  
      this.deleteLink ||= document.createElement('a');
      this.deleteLink.classList.set("my-4 text-right");
      this.deleteLink.innerHTML = `<i class="deleteRecipe fa fa-trash-alt" data-recipe-id="${this.id}"></i>`;
  
      this.element.append(this.nameLink, this.deleteLink);
  
      return this.element;
    }
  }
  
  class Ingredient {
    constructor(attributes) {
      let whitelist = ["id", "name", "recipe_id", "content"]
      whitelist.forEach(attr => this[attr] = attributes[attr])
    }
  
    static container() {
      return this.c ||= document.querySelector("#ingredients")
    }

    static collection() {
      return this.coll ||= {};
    }

    static findById(id) {
      return this.collection()[Ingredient.active_recipe_id].find(ing => ing.id == id);
    }

    static loadByRecipe(id, ingredientsAttrs) {
      Ingredient.active_recipe_id = id;
      let ingredients = ingredientsAttrs.map(ingredientsAttrs => new Ingredient(ingredientsAttrs));
      this.collection()[id] = ingredients;
      let rendered = ingredients.map(ing => ing.render())
      this.container().innerHTML = "";
      this.container().append(...rendered)
    }

    static create(formData) {
      if(!Ingredient.active_recipe_id) {
        return Promise.reject().catch(() => new FlashMessage({type: 'error', message: "Please pick a recipe before adding ingredients."}));
      } else {
        formData.recipe_id = Ingredient.active_recipe_id;
      }
      return Auth.fetch('http://localhost:3000/ingredients',{
        method: 'POST',
        body: JSON.stringify({ ingredient: formData })
      })
        .then(ingData => {
          let ingredient = new Ingredient(ingData);
          this.collection()[Ingredient.active_recipe_id].push(ingredient);
          this.container().append(ingredient.render())
          return ingredient;
        })
        .catch(error =>  FlashMessage({type: 'error', message: error}))
    }

    edit() {
      this.editForm ||= document.createElement('form');
      this.editForm.classList.set("editIngredientForm mb-2");
      this.editForm.dataset.ingredientId = this.id;
      this.editForm.innerHTML = `
        <fieldset class="my-2">
          <label for="name" class="block w-full uppercase">Name</label>
          <input  
            type="text" 
            name="name" 
            id="name"
            class="w-full border-2 rounded p-2 focus:outline-none focus:ring focus:border-blue-300" 
          />
        </fieldset>
        <fieldset class="my-2">
          <label for="content" class="block w-full uppercase">Amounts or Notes</label>
          <textarea 
            id="content" 
            name="content" 
            class="w-full h-32 border-2 rounded p-2 focus:outline-none focus:ring focus:border-blue-300"
          ></textarea>
        </fieldset> 
        <input 
          type="submit" 
          class="w-full block py-3 bg-purple-400 hover:bg-purple-500 transition duration-200 uppercase font-semibold cursor-pointer" 
          value="Save Ingredient" 
        />
      </form>
      `
      this.editForm.querySelector('#name').value = this.name;
      this.editForm.querySelector('#content').value = this.content || '';
      return this.editForm;
    }

    update(formData) {
      return Auth.fetch(`http://localhost:3000/ingredients/${this.id}`, {
        method: "PUT",
        body: JSON.stringify({ingredient: formData})
      })
        .then((ingredientsAttributes) => {
          Object.keys(ingredientsAttributes).forEach(attr => this[attr] = ingredientsAttributes[attr])
          this.render();
          new FlashMessage({type: 'success', message: 'Ingredient Updated!'});
        })
        .catch(error => new FlashMessage({type: 'error', message: error}))
    }

    delete() {
      return Auth.fetch(`http://localhost:3000/ingredients/${this.id}`, {
        method: "DELETE"
      })
        .then(({id}) => {
          let index = Ingredient.collection()[Ingredient.active_recipe_id].findIndex(ing => ing.id == id)
          Ingredient.collection()[Ingredient.active_recipe_id].splice(index, 1);
          this.element.remove();
          return this;
        })
        .catch(error => new FlashMessage({type: 'error', message: error}))
    }

    render() {
      this.element ||= document.createElement('li');
      this.element.classList.set("my-2 px-4 bg-purple-400 grid grid-cols-12");
  
      this.nameSpan ||= document.createElement('span');
      this.nameSpan.classList.set("py-4 col-span-9");
      this.nameSpan.textContent = this.name; 
  
      this.editLink ||= document.createElement('a');
      this.editLink.classList.set("my-1 text-right");
      this.editLink.innerHTML = `<i class="editIngredient p-4 fa fa-pencil-alt" data-ingredient-id="${this.id}"></i>`;
  
      this.deleteLink ||= document.createElement('a');
      this.deleteLink.classList.set("my-1 text-right");
      this.deleteLink.innerHTML = `<i class="deleteIngredient p-4 fa fa-trash-alt" data-ingredient-id="${this.id}"></i>`;
  
      this.element.append(this.nameSpan, this.editLink, this.deleteLink);
  
      return this.element;
    }
  }

  class FlashMessage {
    constructor({type, message}) {
      this.message = message;
      this.color = type == "error" ? 'bg-red-200' : 'bg-blue-100';
      this.render();
    }
  
    static container() {
      return this.c ||= document.querySelector('#flash')
    }
  
    render() {
      this.toggleMessage();
      window.setTimeout(() => this.toggleMessage(), 5000);
    }
  
    toggleMessage() {
      FlashMessage.container().textContent = this.message;
      FlashMessage.container().classList.toggle(this.color);
      FlashMessage.container().classList.toggle('opacity-0');
    }
  }