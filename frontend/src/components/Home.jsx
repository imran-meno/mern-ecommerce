import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
const API_URL = "https://mern-ecommerce-oqzg.onrender.com";

  

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/products)`;
        setProducts(data);
      } catch (err) {
      
        
      }
    };
    fetchProducts();
  }, []);

  const SumbitHandler = async (ProductId) => {
    const user = JSON.parse(localStorage.getItem("user"));

    // ❌ If user not logged in — redirect instead of alert only
    if (!user || !user._id) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    try {
      await axios.post(`${API_URL}/cart`, {
        user_id: user._id,
        product_id: ProductId,
      });

      alert("Item added to cart");
    } catch (error) {
      console.log(error);
      alert("Error adding to cart");
    }
  };
  const handleProductClick = (id) => {
  navigate(`/product/${id}`);
};

  return (
    <div className="main_items">
      <div className="main_item_container">
        {products.map((item) => (
          <div key={item._id} className="item_main" onClick={() => handleProductClick(item._id)} 
>
            <div className="image_background">
              <img src={item.product_image} alt="" className="product_img"  />
            </div>

            <p className="product_name">{item.product_name}</p>
            <p className="product_price">${item.product_price}</p>

            <button className="add_btn" onClick={() => SumbitHandler(item._id)}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
