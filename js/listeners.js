document.addEventListener('DOMContentLoaded', function(e) {
    Auth.init();
    Modal.init();
})

document.addEventListener('click', function(e) {
    let target = e.target;

    if (target.matches('.loginLink')) {
      e.preventDefault();
      Modal.populate({title: "", content: Auth.loginForm()})
      Modal.toggle();
    } else if (target.matches('.logoutLink')) {
      e.preventDefault();
      Auth.logout();
    } else if(target.matches(".selectRecipe")) {
      let recipe = Recipe.findById(target.dataset.recipeId);
      recipe.show();
    } else if(target.matches(".deleteRecipe")) {
      if(confirm("Confirm to delete this recipe?")) {
        let recipe = Recipe.findById(target.dataset.recipeId);
        recipe.delete();
      }
    } else if(target.matches(".editIngredient")) {
      let ing = Ingredient.findById(target.dataset.ingredientId);
      Modal.populate({title: "Edit Ingredient", content: ing.edit()})
      Modal.toggle()
    } else if(target.matches(".deleteIngredient")) {
      if(confirm("Confirm to delete this ingredient?")) {
        let ing = Ingredient.findById(target.dataset.ingredientId);
        ing.delete();
      }
    } else if (target.matches('.multi-submit[type="submit"]')) {
      e.preventDefault();
      let form = target.closest('form');
      if(form.matches('.authForm')) {
        if(target.value === "Login") {
          Auth.login(form.serialize());
        } else if(target.value === "Signup") {
          Auth.signup(form.serialize());
        }
      }
    } else if(target.matches(".modal-close") || target.matches(".modal-overlay")) {
      e.preventDefault();
      Modal.toggle();
    } 
  })

document.addEventListener('submit', function(e) {
    let target = e.target;
    if(target.matches('#newRecipe')) {
        e.preventDefault();
        Recipe.create(target.serialize())
        .then(() => {
          target.reset();
          target.querySelector('input[name="name"]').blur();
        });
    } else if(target.matches('#newIngredientForm')) {
      e.preventDefault();
      Ingredient.create(target.serialize())
        .then(() => target.reset());
    } else if(target.matches('.editIngredientForm')) {
      e.preventDefault();
      let ingredient = Ingredient.findById(target.dataset.ingredientId);
      ingredient.update(target.serialize())
        .then(() => Modal.toggle())
    }
  })

document.addEventListener('keydown', (e) => {
    e = e || window.event;
    let isEscape = false;
    if("key" in e) {
       isEscape = (e.key === "Escape" || e.key === "Esc");
    } else {
      isEscape = (e.keyCode === 27);
    }
     if(isEscape && document.body.classList.contains('modal-active')) {
       Modal.toggle();
    }
  })