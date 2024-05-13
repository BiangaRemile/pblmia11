from flask import Flask, render_template, session, request, jsonify, redirect
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.secret_key = "12SY7EHSHR"

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://u7zmy0hejjm7p17e:8DD3i5n3zUQLM93UJvLx@bulqtqdnglhevjilsdj8-mysql.services.clever-cloud.com:3306/bulqtqdnglhevjilsdj8'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Model User
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(40), nullable=True)
    email = db.Column(db.String(64), unique=True, nullable=False)
    adress = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(64), nullable=False)
    master = db.Column(db.Boolean, nullable=True)
    stores= db.relationship('Store', backref='stores')

# Model Store
class Store(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    adress = db.Column(db.String(64), nullable=False)
    devise = db.Column(db.String(64))
    id_user = db.Column(db.Integer, db.ForeignKey('user.id'))
    products = db.relationship('Product', backref='products')
    historiques = db.relationship('Historique', backref='store')


# Model product
class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    id_store = db.Column(db.Integer, db.ForeignKey('store.id'))
    name = db.Column(db.String(40), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(40))
    price = db.Column(db.Float, nullable=False)
    devise = db.Column(db.String(40))
    historique = db.relationship('Historique', backref='historique')


#Model historique
class Historique(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    operation = db.Column(db.String(5), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    name = db.Column(db.String(40), nullable=False)
    date = db.Column(db.Date, nullable=False)
    price = db.Column(db.Float, nullable=False)
    devise = db.Column(db.String(10))
    unit = db.Column(db.String(40))
    id_product = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    id_store = db.Column(db.Integer, db.ForeignKey('store.id'), nullable=False)


@app.route('/login', methods=['GET', 'POST'])
def index():
    name, email, password, adress, msg = '', '', '', '', ''   
    if request.method == 'POST':
        name = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirmation = request.form['confirmation']
        adress = request.form['adress']
        user = User(name=name, email=email, adress=adress, password=password, master=True)

        if password == confirmation:
            db.session.add(user)
            db.session.commit()

            new_user = User.query.filter_by(email=user.email, password=user.password).first()
            store = Store(adress=user.adress, name="My store", id_user = new_user.id)

            db.session.add(store)
            db.session.commit()

            return redirect('/')
                
       
    return render_template('signup.html', name=name, email=email, adress=adress, password=password, message=msg)
    

@app.route('/', methods=['GET', 'POST'])
def login():
    try:
        user = session['user_id']
        return redirect('/manager')

    except:
        print("No user save !!!")

    email, password, msg = '', '', ''
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(email=email, password=password).first()
        if user:
            session['user_id'] = user.id
            return redirect('/manager')
        else:
            msg = 'Email or Password incorrect'
            
    return render_template('login.html', email=email, password=password, message=msg)


@app.route('/manager')
def manager():

    try:
        store_id = session['store_id']
    except:
        print("No store save !!!")
        store_id = ""

    try:
        user_id = session['user_id']
        user = User.query.filter_by(id=user_id).first()
        stores = Store.query.filter_by(id_user=user.id)
        return render_template('main.html', stores=stores, id_user=user.id, store_id=store_id)
    except:
        return redirect('/')


@app.route('/logout')
def logout():
    user = session.pop('user_id', None)
    store = session.pop('store_id', None)
    print(user, store)
    return redirect('/')


@app.route('/save/store', methods=['POST'])
def save_store():
    name = request.form['name']
    devise = request.form['devise']
    adress = request.form['adress']
    id_user = request.form['id']
    if name and id_user:
        store = Store(name=name, adress=adress, id_user=id_user, devise=devise)
        db.session.add(store)
        db.session.commit()
        return jsonify({'verify': True})
    
    return jsonify({'verify': False})

@app.route('/get/store', methods=['POST'])
def get_store():
    store_id = request.form['store']
    session['store_id'] = int(store_id)
    store = Store.query.filter_by(id=store_id).first()
    if store_id:
        products = {}
        devises = []
        devises_use = []
        devises_add = []
        historiques_store = {}
        products_liste = store.products
        store_historiques = store.historiques
        for product in products_liste:
            quantity = 0
            historiques = product.historique

            for historique in historiques:
                if historique.operation == "add":
                    quantity += historique.quantity
                else:
                    quantity -= historique.quantity

            products[product.id] = [product.name, product.quantity + quantity, product.unit, product.price, product.devise, product.id]

        # Historique store
        for historique in store_historiques:
            historiques_store[historique.id] = [historique.name ,historique.date, historique.quantity, historique.unit, historique.operation]

        somme_devise = db.session.query(Product.devise, db.func.sum(Product.quantity * Product.price)).group_by(Product.devise).filter_by(id_store=store.id)

        somme_use_devise = db.session.query(Historique.devise, db.func.sum(Historique.quantity * Historique.price)).group_by(Historique.devise).filter_by(id_store=store.id, operation='use')
        somme_add_devise = db.session.query(Historique.devise, db.func.sum(Historique.quantity * Historique.price)).group_by(Historique.devise).filter_by(id_store=store.id, operation='add')

        for devise in somme_devise:
            quantity = devise[1]
            for devise_add in somme_add_devise:
                if devise[0] == devise_add[0]:
                    quantity += devise_add[1]

            for devise_use in somme_use_devise:
                if devise[0] == devise_use[0]:
                    quantity -= devise_use[1]

            devises.append((devise[0], float(quantity)))

        for devise in somme_use_devise:
            devises_use.append((devise[0], float(devise[1])))

        for devise in somme_add_devise:
            devises_add.append((devise[0], float(devise[1])))

        return jsonify({'verify': True, 'products': products, 'insight': devises, 'add': devises_add,'use': devises_use,'main_device': store.devise, 'historiques': historiques_store})

    return jsonify({'verify': False})

@app.route('/save/product', methods=['POST'])
def save_product():
    name = request.form['name']
    quantity = request.form['quantity']
    unit = request.form['unit']
    price = request.form['price']
    devise = request.form['devise']
    id_store = request.form['id_store']
    if name and id_store:
        product = Product(name=name, price=price, quantity=quantity, unit=unit, devise=devise,id_store=id_store)
        db.session.add(product)
        db.session.commit()
        return jsonify({'verify': True})
    
    
    return jsonify({'verify': False})

# Modify store
@app.route('/modify/get/store', methods=['POST'])
def get_modify_store():
    id_store = request.form['id_store']
    store = Store.query.filter_by(id=id_store).first()
    detail = [store.name, store.adress, store.devise]

    return jsonify({'store': detail})

@app.route('/modify/save/store', methods=['POST'])
def save_modify_store():
    name = request.form['name']
    adress = request.form['adress']
    devise = request.form['device']
    id_store = request.form['id_store']

    print(name, devise, adress)

    db.session.query(Store).filter_by(id=id_store).update({'name': name, 'adress': adress, 'devise': devise})
    db.session.commit()

    return jsonify({'verify': True})

# Historique operations
@app.route('/historique/save', methods=['POST'])
def historique_save():
    id_product = request.form['id_product']
    operation = request.form['operation']
    quantity = request.form['quantity']
    price = request.form['price']
    devise = request.form['devise']
    id_store = request.form['id_store']
    unit = request.form['unit']
    name = request.form["name"]
    date = datetime.now().date()

    historique = Historique(operation=operation, name=name, quantity=quantity, id_product=id_product, date=date, price=price, devise=devise, id_store=id_store, unit=unit)
    db.session.add(historique)
    db.session.commit()

    return jsonify({'verify': True})

# Delete historique
@app.route('/historique/delete', methods=['POST'])
def historique_delete():
    id_historique = request.form['id_historique']
    db.session.query(Historique).filter_by(id=id_historique).delete()
    db.session.commit()
    return jsonify({'verify': True})


# Delete product
@app.route('/product/delete', methods=['POST'])
def product_delete():
    id_product = int(request.form['id_product'])
    db.session.query(Product).filter_by(id=id_product).delete()
    db.session.commit()
    return jsonify({'verify': True})

# Modify product
@app.route('/product/modify', methods=['POST'])
def product_modify():
    id_product = int(request.form['id_product'])
    name = request.form['name']
    quantity = request.form['quantity']
    unit = request.form['unit']
    price = request.form['price']
    devise = request.form['devise']
    db.session.query(Product).filter_by(id=id_product).update({'name': name, 'quantity': quantity, 'unit': unit, 'price': price, 'devise': devise})
    db.session.commit()
    return jsonify({'verify': True})


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        app.run(debug=True)