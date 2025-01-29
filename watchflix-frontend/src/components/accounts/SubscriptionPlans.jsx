import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const fetchPlans = async () => {
      const response = await axios.get('http://localhost:8000/accounts/subscription-plans/');
      setPlans(response.data);
    };
    fetchPlans();
  }, []);

  return (
    <div>
      <h2>Subscription Plans</h2>
      <ul>
        {plans.map(plan => (
          <li key={plan.name}>
            {plan.name} - ${plan.price}
            <ul>
              {plan.features.map((feature, index) => (
                <li key={index}>{feature.description}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SubscriptionPlans;
