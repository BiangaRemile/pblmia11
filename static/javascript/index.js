
let productsListe ={}

const sideMenu = document.querySelector('aside')
const menuBth = document.querySelector('#menu-bar')    
const closeBth = document.querySelector('#close') 
const items = document.querySelectorAll('.item')

const urlLocal = window.location.href


const themeToggle = document.querySelector('.theme-toggle')

menuBth.addEventListener('click', () => {
    sideMenu.style.display = 'block'
})

closeBth.addEventListener('click', () => {
    sideMenu.style.display = 'none'
})

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme-variable')
    themeToggle.querySelector('span:nth-child(1)').classList.toggle('active')
    themeToggle.querySelector('span:nth-child(2)').classList.toggle('active')
})

items.forEach(element => {
    element.addEventListener('click', () => {
        document.querySelector('.active').classList.remove('active')
        element.classList.add('active')
    })
});

// Add store
const addStore = document.querySelector('#add-store')
const addStoreBox = document.querySelector('.add-store')
const addStoreForm = document.forms['add-store']

addStore.addEventListener('click', () => {
    addStoreBox.style.display = 'flex'
})

function closeStoreBox() {
    addStoreBox.querySelectorAll('input').forEach(input => {
        input.value = ''
    })
    addStoreBox.querySelector('textarea').value = ''
    addStoreBox.style.display = 'none'
}

addStoreBox.querySelector('.cancel').addEventListener('click', closeStoreBox)

addStoreBox.querySelector('.sub').addEventListener('click', () => {
    var name = addStoreForm.name.value
    var adress = addStoreForm.adress.value
    var id_user = addStoreForm.id_user.value
    var devise = addStoreForm.devise.value

    $.ajax({
        data: {name: name, adress: adress, id: id_user, devise: devise},
        type: 'POST',
        url: '/save/store',
        success: function(response) {
            console.log(response);
        },
        error: function (error) {
            console.log(error)
        }
    })
    closeStoreBox()
})

// modify store
const modifyStoreBox = document.querySelector('.modify-store')
const modifyStoreForm = document.forms['modify-store']
const modifyStore = document.querySelector('#mofify-store')

modifyStore.addEventListener('click', () => {
    if (selectSection.value != '') {
    modifyStoreBox.style.display = 'flex'
    $.ajax({
        url: '/modify/get/store',
        type: 'post',
        data: {id_store: selectSection.value},
        success: function(response) {
            const data = response.store
            modifyStoreForm.name.value = data[0]
            modifyStoreForm.adress.value = data[1]
            modifyStoreForm.devise.value = data[2]
        },
        error: function(error) {
            console.log(error);
        }})
    }
})

modifyStoreBox.querySelector('.cancel').addEventListener('click', () => {
    modifyStoreBox.style.display = 'none'
})

modifyStoreBox.querySelector('.sub').addEventListener('click', () => {

    const store_id = selectSection.value
    var name = modifyStoreForm.name.value
    var adress = modifyStoreForm.adress.value
    var device = modifyStoreForm.devise.value

    $.ajax({
        url: '/modify/save/store',
        type:'post',
        data: {name: name, adress: adress, device: device, id_store: store_id},
        success: function(response) {
            modifyStoreBox.style.display = 'none'
            console.log(response);
        },
        error: function (error) {
            console.log(error)
        }
    })
})

// add product
const addProductBtn = document.querySelector('#add-product')
const addProductBox = document.querySelector('.add-product')
const addProductForm = document.forms['add-product']

addProductBtn.addEventListener('click', () => {
    if (selectSection.value != '')
        addProductBox.style.display = 'flex'
})

function closeProductBox() {
    addProductBox.querySelectorAll('input').forEach(input => {
        input.value = ''
    })
    addProductBox.style.display = 'none'
}

addProductBox.querySelector('.cancel').addEventListener('click', closeProductBox)

addProductBox.querySelector('.sub').addEventListener('click', () => {
    var name = addProductForm.product_name.value
    var quantity = addProductForm.quantity.value
    var unit = addProductForm.unit.value
    var price = addProductForm.price.value
    var devise = addProductForm.devise.value

    $.ajax({
        data: {name: name, quantity: quantity, unit: unit, price: price, devise: devise, id_store: selectSection.value},
        type: 'POST',
        url: '/save/product',
        success: function(response) {
            console.log(response);
        },
        error: function (error) {
            console.log(error)
        }
    })
    closeProductBox()
})

// select Button
const selectSection = document.querySelector('#store')
selectSection.onchange = function() {
    getStore(this.value)
}


// get store information
let productSection = document.querySelector('#products')

function getStore(store) {
    $.ajax({
    url: '/get/store',
    type: 'post',
    data: {store: store},
    success: function (response) {
        productsListe = response.products;
        const devices = response.insight
        const main_device = response.main_device
        const historique = response.historiques
        const use = response.use
        const add = response.add
        console.log(use);
        productSection.querySelector('tbody').innerHTML = ''
        historiqueSection.querySelector('tbody').innerHTML = ''

        editInsightDiv(devices, document.querySelector('#prices-total'), main_device)
        editInsightDiv(use, document.querySelector('#prices-use'), main_device)
        editInsightDiv(add, document.querySelector('#prices-add'), main_device)
        

        try {
            for (let [product_id, details] of Object.entries(productsListe)) {
            if (product_id) {
                somme = details[1] * details[3]
                productSection.querySelector('tbody').innerHTML += `
                    <tr>
                        <td><a id="${details[5]}" class="primary products-keys">${details[0]}</a></td>
                        <td>${details[1]} ${details[2]}</td>
                        <td>${somme} ${details[4]}</td>
                        <td><a class="primary operation" id="${details[5]}">Opérations</a></td>
                    </tr>`
            } else {
                productSection.querySelector('tbody').innerHTML = `
                    <tr> 
                        <td colspan="5"> Aucune donnée </td> 
                    </tr>
                `
            }}
        } catch(e) {
            console.log(e);
        }
            getHistorique(historique)
            detailsOperation(productSection)
            modifyProductBtn()
        },
        error: function (error) {
            console.log(error);
        }
    })
}

getStore(selectSection.value)

// product detail

const detailsBox = document.querySelector('.details')
const detailsForm = document.forms['details']

function detailsOperation(section) {
    const detailBtns = section.querySelectorAll('.operation')
    let detailProduct
    detailBtns.forEach(detailBtn => {
        detailBtn.addEventListener('click', (e) => {
            idTarget = e.target.getAttribute('id')
            for (let [key, value] of Object.entries(productsListe)) {
                if(key == idTarget) {
                    detailProduct = value
                    detailsBox.querySelector('h1').innerHTML = `${value[0]}`
                    detailsForm.stock_quantity.value = `${value[1]} ${value[2]}`
                    detailsForm.unit.value = `${value[3]} ${value[4]}`
                    detailsBox.style.display = 'flex'
                }
            }
        })
    })

    detailsBox.querySelector('.cancel'). addEventListener('click', () => {
        detailsBox.style.display = 'none'
    })

    detailsBox.querySelector('.add'). addEventListener('click', () => {
        var quantity = detailsForm.quantity.value
    if (quantity) {
        if (quantity > 0) {
            $.ajax({
                url: '/historique/save',
                type: 'post',
                data: {id_product: detailProduct[5], name: detailProduct[0],operation: 'add', quantity: quantity, price: detailProduct[3], devise: detailProduct[4], id_store: selectSection.value, unit: detailProduct[2]},
                success: function (response) {
                    location.reload()
                },
                error: function (error) {
                    console.log(error);
                }
            })
        }
            
        detailsBox.style.display = 'none'}
    })

    detailsBox.querySelector('.use'). addEventListener('click', () => {
        var quantity = detailsForm.quantity.value
    if (quantity) {
        if (quantity > 0) {
            $.ajax({
                url: '/historique/save',
                type: 'post',
                data: {id_product: detailProduct[5], name: detailProduct[0], operation: 'use', quantity: quantity, price: detailProduct[3], devise: detailProduct[4], id_store: selectSection.value, unit: detailProduct[2]},
                success: function (response) {
                    location.reload()
                },
                error: function (error) {
                    console.log(error);
                }
            })
        }
        detailsBox.style.display = 'none'}
    })
}

// historique 
const historiqueSection = document.querySelector('#historique')

function getHistorique(historique) {
    try {
        for (let [key, value] of Object.entries(historique)) {
        const date = new Date(value[1])

        color = value[4] == 'add'? 'success': 'warning'

        historiqueSection.querySelector('tbody').innerHTML += `
            <tr>
                <td>${date.getDate()} - ${date.getMonth() + 1} - ${date.getFullYear()}</td>
                <td>${value[0]}</td>
                <td>${value[2]} ${value[3]}</td>
                <td class="${color}">${value[4]}</td>
                <td><a class="danger historique-detail" id="${key}">Delete</a></td>
            </tr>`
        }
    } catch(e) {
        console.log(e);
    }
    const historiqueBtns = historiqueSection.querySelectorAll('.historique-detail')
    historiqueBtns.forEach(historiqueBtn => {
        historiqueBtn.addEventListener('click', (e) => {
            idTarget = e.target.getAttribute('id');
            $.ajax({
                url: '/historique/delete',
                type: 'post',
                data: {id_historique: idTarget},
                success: function (response) {
                    location.reload()
                },
                error: function (error) {
                    log(error)
                }
            })
        })
    })

}

// insight div
function editInsightDiv(datas, div, main_device) {
    
    div.innerHTML = '<h1> 0.00 </h1>'
    let val = ''

    try{
        datas.forEach(data => {
            if( main_device == data[0]) {
                val = `<h1>${data[1]} ${data[0]}</h1><br>`
                div.innerHTML = val
            }
        }) 
        datas.forEach(data => {
                val = data[0] == main_device? '': `<small>${data[1]} ${data[0]}</small><br>`
                div.innerHTML += val
            }) 
    }catch(e) {
        div.innerHTML = '<h1> 0.00 </h1>'
    }
}

// modify-product
const modifyProduct = document.querySelector('.modify-product')
const modifyProductForm = document.forms['modify-product']

modifyProduct.querySelector('.cancel').addEventListener('click', () => {
    modifyProduct.style.display = 'none'
})

function modifyProductBtn() {
    const btns = document.querySelectorAll('.products-keys')
    let id_product;
    btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            for (let [key, values] of Object.entries(productsListe)) {
                if (e.target.getAttribute('id') == key) {
                    console.log(values);
                    modifyProductForm.product_name.value = values[0]
                    modifyProductForm.quantity.value = values[1]
                    modifyProductForm.unit.value = values[2]
                    modifyProductForm.price.value = values[3]
                    modifyProductForm.devise.value = values[4]
                    id_product = key
                    modifyProduct.style.display = 'flex'
                }
            }

        })
    })

    modifyProduct.querySelector('.del').addEventListener('click', () => {

        $.ajax({
            url: '/product/delete',
            type: 'post',
            data: {id_product: id_product},
            success: function(response) {
                console.log(response);
            },
            error: function(error) {
                console.log(error);
            }
        })

        modifyProduct.style.display = 'none'
    })

    modifyProduct.querySelector('.save').addEventListener('click', () => {

        product_name = modifyProductForm.product_name.value
        quantity = modifyProductForm.quantity.value
        unit = modifyProductForm.unit.value
        price = modifyProductForm.price.value
        devise = modifyProductForm.devise.value

        $.ajax({
            url: '/product/modify',
            type: 'post',
            data: {id_product: id_product, name: product_name, quantity: quantity, unit: unit, price: price, devise: devise},
            success: function(response) {
                console.log(response);
            },
            error: function(error) {
                console.log(error);
            }
        })

        modifyProduct.style.display = 'none'
    })

}